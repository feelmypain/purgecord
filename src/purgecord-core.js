const PREFIX = '[PURGECORD]';

import { log } from './utils/log.js';
import {
  wait,
  clamp,
  msToHMS,
  redact,
  escapeHTML,
  queryString,
  ask,
  toSnowflake,
  displayName,
} from './utils/helpers.js';

/** Absolute URLs also work in extension contexts that cannot resolve relative fetch URLs. */
const API = new URL('/api/v9', window.location.href).href;
/** Discord returns at most 25 hits per search page. */
const PAGE_SIZE = 25;
const REQUEST_TIMEOUT = 30000;
const MAX_SEARCH_ATTEMPTS = 20;
/** How many times a finished walk may restart to sweep up stragglers. */
const MAX_SWEEPS = 2;
/** Rate-limit retries for one message, separate from the user's maxAttempt. */
const MAX_THROTTLE_RETRIES = 5;
const MAX_SEARCH_DELAY = 60000;
const MAX_DELETE_DELAY = 30000;
/** Padding on top of the retry_after Discord asks for, to survive clock skew. */
const RETRY_MARGIN = 250;

/**
 * Message types Discord refuses to delete.
 * Mirrors discord.js' UndeletableMessageTypes plus the client-only types
 * documented as non-deletable. Everything not listed here is deletable, so new
 * Discord message types keep working without a code change.
 * @see https://discord.com/developers/docs/resources/message#message-object-message-types
 */
const UNDELETABLE_MESSAGE_TYPES = new Set([1, 2, 3, 4, 5, 21, 33, 34, 35, 56, 57, 64]);

/**
 * Discord error codes that will never succeed for this message. Retrying them
 * only burns the invalid-request budget that leads to a Cloudflare ban.
 */
const PERMANENT_DELETE_ERRORS = {
  50021: 'it is a system message',
  50083: 'the thread is archived (open the thread to unarchive it, then run again)',
  160005: 'the thread is locked',
  50013: 'you do not have permission to delete it',
  50001: 'you do not have access to that channel',
  50003: 'that action cannot be performed on a DM channel',
};

// Outcome of a single delete attempt.
const DELETED = 'DELETED';           // we removed it
const ALREADY_GONE = 'ALREADY_GONE'; // it was gone before we got there
const RETRY = 'RETRY';               // transient, worth another attempt
const SKIPPED = 'SKIPPED';           // permanently undeletable, move on
const FAILED = 'FAILED';             // unknown failure, retryable

class PurgecordError extends Error {
  constructor(message, { fatal = false, status = 0, code = 0 } = {}) {
    super(message);
    this.name = 'PurgecordError';
    this.fatal = fatal;
    this.status = status;
    this.code = code;
  }
}

/** Read a response body exactly once, parsing it as JSON when possible. */
async function readBody(resp) {
  let text = '';
  try { text = await resp.text(); } catch { /* body already gone */ }
  try { return { json: JSON.parse(text), text }; } catch { return { json: null, text }; }
}

/**
 * How long Discord asked us to wait, in milliseconds.
 * Both the Retry-After header and the JSON body report seconds.
 */
function retryAfterMs(resp, body) {
  const header = parseFloat(resp.headers.get('retry-after'));
  if (Number.isFinite(header)) return header * 1000;
  const fromBody = body && Number(body.retry_after);
  if (Number.isFinite(fromBody) && fromBody > 0) return fromBody * 1000;
  return 0;
}

/**
 * A 429 that is not Discord JSON came from Cloudflare, which bans the IP for
 * up to 24h. Retrying it makes things strictly worse.
 */
function isEdgeBlock(resp, body) {
  if (body && body.code === 40333) return true;
  return resp.status === 429 && !body;
}

/** The text of a message as a user thinks of it, including modern shapes. */
function messageText(message) {
  const parts = [message.content || ''];
  // Forwarded messages carry their text in a snapshot, not in content.
  if (Array.isArray(message.message_snapshots)) {
    for (const snapshot of message.message_snapshots) {
      if (snapshot && snapshot.message && snapshot.message.content) parts.push(snapshot.message.content);
    }
  }
  if (message.poll && message.poll.question) parts.push(message.poll.question.text || '');
  return parts.join('\n');
}

/** A short human label for messages that have no text of their own. */
function messagePreview(message) {
  const text = messageText(message);
  if (text) return text;
  if (message.attachments && message.attachments.length) return '[ATTACHMENTS]';
  if (message.poll) return '[POLL]';
  if (message.flags & (1 << 14)) return '[FORWARDED]';
  if (message.flags & (1 << 13)) return '[VOICE MESSAGE]';
  if (message.embeds && message.embeds.length) return '[EMBED]';
  return '';
}

/**
 * Delete all messages in a Discord channel or DM
 * @author Victornpb <https://www.github.com/victornpb>
 * @see https://github.com/victornpb/undiscord
 */
class PurgecordCore {

  options = {
    authToken: null, // Your authorization token
    authorId: null, // Author of the messages you want to delete
    guildId: null, // Server were the messages are located
    channelId: null, // Channel were the messages are located
    minId: null, // Only delete messages after this, leave blank do delete all
    maxId: null, // Only delete messages before this, leave blank do delete all
    content: null, // Filter messages that contains this text content
    hasLink: null, // Filter messages that contains link
    hasFile: null, // Filter messages that contains file
    includeNsfw: null, // Search in NSFW channels
    includePinned: null, // Delete messages that are pinned
    pattern: null, // Only delete messages that match the regex (insensitive)
    searchDelay: null, // Delay each time we fetch for more messages
    deleteDelay: null, // Delay between each delete operation
    maxAttempt: 2, // Attempts to delete a single message if it fails
    emptyPageRetries: 3, // Times to re-check an empty page before believing the channel is done
    jobDelay: 10000, // Delay between channels when running a batch
    askForConfirmation: true,
    debug: false, // Dump raw API payloads to the browser console
  };

  state = {
    running: false,
    delCount: 0,
    confirmedDelCount: 0, // deletes the API confirmed, i.e. not "already gone"
    failCount: 0,
    grandTotal: 0,
    iterations: 0,
    cursorId: null, // max_id of the next search page (see advanceCursor)
    emptyPages: 0,

    _searchResponse: null,
    _messagesToDelete: [],
    _skippedMessages: [],
  };

  stats = {
    startTime: new Date(), // start time
    throttledCount: 0, // how many times you have been throttled
    throttledTotalTime: 0, // the total amount of time you spent being throttled
    lastPing: null, // the most recent ping
    avgPing: null, // average ping used to calculate the estimated remaining time
    etr: 0,

    // Adaptive pacing. These are added on top of the delays the user configured
    // and decay back to zero; options is never written to.
    searchBackoff: 0,
    deleteBackoff: 0,
    searchNextAt: 0,
    deleteNextAt: 0,
  };

  // events
  onStart = undefined;
  onProgress = undefined;
  onStop = undefined;

  /** Whether a run or batch is currently in flight. */
  get busy() { return this.#busy; }

  resetState() {
    this.state = {
      running: false,
      delCount: 0,
      confirmedDelCount: 0,
      failCount: 0,
      grandTotal: 0,
      iterations: 0,
      cursorId: null,
      emptyPages: 0,

      _searchResponse: null,
      _messagesToDelete: [],
      _skippedMessages: [],
    };

    // Keep the cumulative throttle counters, drop everything that would poison
    // the next run (a stale backoff would silently slow it down).
    this.stats.searchBackoff = 0;
    this.stats.deleteBackoff = 0;
    this.stats.searchNextAt = 0;
    this.stats.deleteNextAt = 0;
    this.stats.etr = 0;

    this.options.askForConfirmation = true;
  }

  /** Automate the deletion process of multiple channels */
  async runBatch(queue) {
    if (this.#busy) return log.error('Already running!');
    this.#busy = true;

    // Job options must not leak into the next job.
    const baseOptions = { ...this.options };

    log.info(`Runnning batch with queue of ${queue.length} jobs`);
    this.state.running = true;
    // The batch owns the lifecycle: firing these per job would unlock the UI
    // (and kill the Stop button) during every inter-job pause.
    if (this.onStart) this.onStart(this.state, this.stats);

    try {
      for (let i = 0; i < queue.length; i++) {
        if (!this.state.running) break;

        // Firing every job's first search back to back is a self-inflicted 429.
        if (i > 0) {
          log.verb(`Waiting ${(this.options.jobDelay / 1000).toFixed(1)}s before the next channel...`);
          await this.cooldown(this.options.jobDelay);
          if (!this.state.running) break;
        }

        this.options = { ...baseOptions, ...queue[i] };
        log.info('Starting job...', `(${i + 1}/${queue.length})`);

        try {
          await this.run(true);
        } catch (err) {
          log.error(`Job ${i + 1} failed:`, escapeHTML(err && err.message || err));
          // A dead token or an edge block fails identically for every remaining
          // job, so there is nothing to be gained by continuing.
          if (err && err.fatal) {
            this.state.running = false;
            break;
          }
        }

        if (!this.state.running) break;

        log.info('Job ended.', `(${i + 1}/${queue.length})`);
        // Carry the prompt state forward only if this job actually prompted;
        // a job that died early must not silence the rest of the batch.
        baseOptions.askForConfirmation = this.options.askForConfirmation;
        this.resetState();
        this.state.running = true; // continue running
      }
    } finally {
      this.options = baseOptions;
      this.state.running = false;
      this.#busy = false;
      log.info('Batch finished.');
      if (this.onStop) this.onStop(this.state, this.stats);
    }
  }

  /** Start the deletion process */
  async run(isJob = false) {
    if (this.#busy && !isJob) return log.error('Already running!');
    if (!this.options.guildId) return log.error('You must fill the "Server ID" field!');
    if (this.options.guildId === '@me' && !this.options.channelId) return log.error('You must fill the "Channel ID" field to delete direct messages!');
    if (!isJob) this.#busy = true;

    this.state.running = true;
    this.stats.startTime = new Date();
    // The walk starts at the user's upper bound and moves backwards in time.
    this.state.cursorId = toSnowflake(this.options.maxId) || null;

    log.success(`\nStarted at ${this.stats.startTime.toLocaleString()}`);
    log.debug(
      `authorId = "${redact(this.options.authorId)}"`,
      `guildId = "${redact(this.options.guildId)}"`,
      `channelId = "${redact(this.options.channelId)}"`,
      `minId = "${redact(this.options.minId)}"`,
      `maxId = "${redact(this.options.maxId)}"`,
      `hasLink = ${!!this.options.hasLink}`,
      `hasFile = ${!!this.options.hasFile}`,
    );

    if (!isJob && this.onStart) this.onStart(this.state, this.stats); // a batch owns its own lifecycle

    // When a walk finishes having actually removed something we sweep the
    // channel again, because Discord's search index can hide messages that were
    // there all along. A pass has to confirm a deletion to earn the next one,
    // and MAX_SWEEPS bounds it regardless.
    let deletedBeforePass = 0;
    let sweeps = 0;

    try {
      do {
        this.state.iterations++;

        log.verb('Fetching messages...');
        await this.pace('search');
        if (!this.state.running) break;

        const data = await this.search();
        if (!this.state.running) break;
        if (!data) break; // nothing more we can do with this channel

        this.filterResponse(data);

        const found = this.state._messagesToDelete.length + this.state._skippedMessages.length;
        log.verb(
          `Grand total: ${this.state.grandTotal}`,
          `(Messages in current page: ${found}`,
          `To be deleted: ${this.state._messagesToDelete.length}`,
          `Skipped: ${this.state._skippedMessages.length})`
        );
        this.printStats();

        // Calculate estimated time
        this.calcEtr();
        log.verb(`Estimated time remaining: ${msToHMS(this.stats.etr)}`);

        if (found === 0) {
          // Discord's search index lags behind deletions, so a single empty
          // page does not mean the channel is clean.
          const remaining = Number(data.total_results) || 0;
          if (remaining === 0 || this.state.emptyPages >= this.options.emptyPageRetries) {
            if (this.state.confirmedDelCount > deletedBeforePass && sweeps < MAX_SWEEPS) {
              sweeps++;
              log.verb(`Reached the end. Sweeping the channel again to catch anything the search index was hiding... (${sweeps}/${MAX_SWEEPS})`);
              deletedBeforePass = this.state.confirmedDelCount;
              this.state.cursorId = toSnowflake(this.options.maxId) || null;
              this.state.emptyPages = 0;
              continue;
            }
            log.verb('Ended because the API returned an empty page.');
            if (isJob) break; // break without stopping if this is part of a job
            this.state.running = false;
            break;
          }
          this.state.emptyPages++;
          const settle = this.state.emptyPages * Math.max(this.options.searchDelay, 2000);
          log.warn(
            `The page came back empty but the API still reports ${remaining} message(s).`,
            `Waiting ${(settle / 1000).toFixed(1)}s for the search index to catch up...`,
            `(${this.state.emptyPages}/${this.options.emptyPageRetries})`
          );
          await this.cooldown(settle);
          continue;
        }

        this.state.emptyPages = 0;

        if (this.state._messagesToDelete.length > 0) {
          if (await this.confirm() === false) {
            this.state.running = false; // break out of a job
            break; // immmediately stop this iteration
          }

          await this.deleteMessagesFromList();
        }
        else {
          // A page full of things we cannot delete (system messages, pinned,
          // filtered out). Nothing to do but page past them.
          log.verb('There\'s nothing we can delete on this page, checking next page...');
        }

        // Walk past everything this page returned. Paging by id instead of by
        // offset means deleting messages cannot shift the window under us, and
        // there is no 9975 offset ceiling to hit.
        this.advanceCursor();

      } while (this.state.running);
    } finally {
      this.stats.endTime = new Date();
      log.success(`Ended at ${this.stats.endTime.toLocaleString()}! Total time: ${msToHMS(this.stats.endTime.getTime() - this.stats.startTime.getTime())}`);
      this.printStats();
      log.debug(`Deleted ${this.state.delCount} messages, ${this.state.failCount} failed.\n`);
      if (this.state.failCount > 0) log.info('Run it again to retry the messages that failed.');

      if (!isJob) {
        // A batch keeps state.running set so its loop can continue; a plain run
        // owns the flag and must clear it however it exited.
        this.state.running = false;
        this.#busy = false;
        if (this.onStop) this.onStop(this.state, this.stats);
      }
    }
  }

  stop() {
    this.state.running = false;
    // The loop's finally block unlocks the UI once it actually unwinds; doing it
    // here as well would re-enable Start while a request is still in flight.
    if (!this.#busy && this.onStop) this.onStop(this.state, this.stats);
  }

  /**
   * Move the pagination cursor just past the oldest message of the current
   * page. Snowflakes are time-ordered, so forcing the cursor to strictly
   * decrease guarantees the walk terminates even if the API ever treats max_id
   * as inclusive.
   */
  advanceCursor() {
    const page = this.state._messagesToDelete.concat(this.state._skippedMessages);
    if (!page.length) return;

    // The page is sorted newest first, but do not trust that for correctness.
    let oldest = null;
    for (const message of page) {
      if (!/^\d+$/.test(message.id)) continue;
      const id = BigInt(message.id);
      if (oldest === null || id < oldest) oldest = id;
    }
    if (oldest === null) return;

    const current = this.state.cursorId ? BigInt(this.state.cursorId) : null;
    if (current !== null && oldest >= current) oldest = current - 1n;
    this.state.cursorId = oldest.toString();
  }

  /** Calculate the estimated time remaining based on the current stats */
  calcEtr() {
    const remaining = Math.max(0, this.state.grandTotal - this.state.delCount - this.state.failCount);
    const perMessage = this.options.deleteDelay + this.stats.deleteBackoff + (this.stats.avgPing || 0);
    const perPage = this.options.searchDelay + this.stats.searchBackoff;
    this.stats.etr = (perPage * Math.ceil(remaining / PAGE_SIZE)) + (perMessage * remaining);
  }

  /** As for confirmation in the beggining process */
  async confirm() {
    if (!this.options.askForConfirmation) return true;

    log.verb('Waiting for your confirmation...');
    const preview = this.state._messagesToDelete.map(m => `${displayName(m.author)}: ${messagePreview(m)}`).join('\n');

    const answer = await ask(
      `Do you want to delete ~${this.state.grandTotal} messages? (Estimated time: ${msToHMS(this.stats.etr)})` +
      '(The actual number of messages may be less, depending if you\'re using filters to skip some messages)' +
      '\n\n---- Preview ----\n' +
      preview
    );

    if (!answer) {
      log.error('Aborted by you!');
      return false;
    }
    else {
      log.verb('OK');
      this.options.askForConfirmation = false; // do not ask for confirmation again on the next request
      return true;
    }
  }

  async search() {
    const isDM = this.options.guildId === '@me';
    const url = isDM
      ? `${API}/channels/${this.options.channelId}/messages/search?` // DMs
      : `${API}/guilds/${this.options.guildId}/messages/search?`; // Server

    const query = queryString([
      ['limit', PAGE_SIZE],
      ['author_id', this.options.authorId || undefined],
      ['channel_id', (!isDM && this.options.channelId) || undefined],
      ['min_id', toSnowflake(this.options.minId)],
      ['max_id', this.state.cursorId || undefined],
      ['sort_by', 'timestamp'],
      ['sort_order', 'desc'],
      ['has', this.options.hasLink ? 'link' : undefined],
      ['has', this.options.hasFile ? 'file' : undefined],
      ['content', this.options.content || undefined],
      ['include_nsfw', this.options.includeNsfw ? true : undefined],
    ]);

    for (let attempt = 1; attempt <= MAX_SEARCH_ATTEMPTS; attempt++) {
      if (!this.state.running) return null;

      let resp;
      try {
        resp = await this.request(url + query);
      } catch (err) {
        // Network error or timeout. Worth retrying, the API never saw it.
        log.warn('Search request failed:', escapeHTML(err && err.message || err));
        this.penalize('search', MAX_SEARCH_DELAY);
        await this.cooldown(this.effectiveDelay('search'));
        continue;
      }

      const { json, text } = await readBody(resp);

      if (isEdgeBlock(resp, json)) throw this.edgeBlocked();

      // Not indexed yet
      if (resp.status === 202) {
        const w = clamp(retryAfterMs(resp, json) || 5000, 1000, MAX_SEARCH_DELAY);
        this.stats.throttledCount++;
        this.stats.throttledTotalTime += w;
        log.warn(`This channel isn't indexed yet. Waiting ${(w / 1000).toFixed(1)}s for discord to index it...`);
        await this.cooldown(w);
        continue;
      }

      if (resp.status === 429) {
        this.penalize('search', MAX_SEARCH_DELAY);
        // Honour whatever Discord asked for in full — capping it would just put
        // us back inside the window it told us to stay out of. A retry_after of
        // 0 means "we did not say", so fall back to our own pace.
        const asked = retryAfterMs(resp, json);
        const w = (asked > 0 ? asked : clamp(this.effectiveDelay('search'), 1000, MAX_SEARCH_DELAY)) + RETRY_MARGIN;
        this.stats.throttledCount++;
        this.stats.throttledTotalTime += w;
        log.warn(`Being rate limited by the API for ${w}ms! Slowing down searches...`);
        this.printStats();
        await this.cooldown(w);
        continue;
      }

      if (!resp.ok) {
        const code = json && json.code;

        if (resp.status === 401) {
          throw new PurgecordError('Your authorization token is invalid or expired. Press "fill" to grab a fresh one.', { fatal: true, status: 401 });
        }
        // The channel is gone, or was never ours to read. End this job quietly
        // so a batch over an old archive is not killed by one dead server.
        if (resp.status === 403 || resp.status === 404 || code === 50001 || code === 50024) {
          log.warn(`Skipping this channel, the API responded with status ${resp.status}:`, escapeHTML(text));
          return null;
        }
        throw new PurgecordError(`Error searching messages, API responded with status ${resp.status}! ${text}`, { status: resp.status, code });
      }

      this.updatePace('search', resp);
      this.relax('search');

      const data = json || {};
      this.state._searchResponse = data;
      if (this.options.debug) console.log(PREFIX, 'search', data);
      return data;
    }

    throw new PurgecordError(`Giving up on searching after ${MAX_SEARCH_ATTEMPTS} attempts.`);
  }

  filterResponse(data) {
    // the search total will decrease as we delete stuff
    const total = Number(data.total_results) || 0;
    if (total > this.state.grandTotal) this.state.grandTotal = total;

    // Each hit is wrapped in an array that used to carry the surrounding
    // conversation; Discord no longer returns that context.
    // Never guess which element was the hit: picking wrong here would delete a
    // message the search did not match.
    const groups = Array.isArray(data.messages) ? data.messages : [];
    const discoveredMessages = groups
      .map(group => {
        if (!Array.isArray(group)) return group;
        return group.find(message => message.hit === true) || (group.length === 1 ? group[0] : null);
      })
      .filter(message => message && message.id);

    // We can only delete some types of messages, system messages are not deletable.
    let messagesToDelete = discoveredMessages;
    messagesToDelete = messagesToDelete.filter(msg => !UNDELETABLE_MESSAGE_TYPES.has(msg.type));
    messagesToDelete = messagesToDelete.filter(msg => msg.pinned ? this.options.includePinned : true);

    // custom filter of messages
    if (this.options.pattern) {
      try {
        const regex = new RegExp(this.options.pattern, 'i');
        messagesToDelete = messagesToDelete.filter(msg => regex.test(messageText(msg)));
      } catch (e) {
        log.warn('Ignoring RegExp because pattern is malformed!', e);
      }
    }

    // create an array containing everything we skipped (used to page past them)
    const skippedMessages = discoveredMessages.filter(msg => !messagesToDelete.includes(msg));

    this.state._messagesToDelete = messagesToDelete;
    this.state._skippedMessages = skippedMessages;

    if (this.options.debug) console.log(PREFIX, 'filterResponse', { toDelete: messagesToDelete.length, skipped: skippedMessages.length, cursorId: this.state.cursorId });
  }

  async deleteMessagesFromList() {
    for (let i = 0; i < this.state._messagesToDelete.length; i++) {
      const message = this.state._messagesToDelete[i];
      if (!this.state.running) return log.error('Stopped by you!');

      log.debug(
        `[${this.state.delCount + 1}/${this.state.grandTotal}] ` +
        `<sup>${new Date(message.timestamp).toLocaleString()}</sup> ` +
        `<b>${redact(displayName(message.author))}</b>` +
        `: <i>${redact(messagePreview(message)).replace(/\n/g, '↵')}</i>`,
        `<sup>{ID:${redact(message.id)}}</sup>`
      );

      // Delete a single message. Being throttled is not the message's fault, so
      // it gets its own (larger) budget than an actual failure.
      let result = FAILED;
      let failures = 0;
      let throttles = 0;
      for (;;) {
        await this.pace('delete');
        if (!this.state.running) return log.error('Stopped by you!');

        result = await this.deleteMessage(message);

        if (result === RETRY) {
          if (++throttles >= MAX_THROTTLE_RETRIES) break;
        }
        else if (result === FAILED) {
          if (++failures >= this.options.maxAttempt) break;
          log.verb(`Retrying... (${failures}/${this.options.maxAttempt})`);
        }
        else break;
      }

      if (result === DELETED || result === ALREADY_GONE) {
        this.state.delCount++;
        // Only a message we actually removed proves the run is progressing.
        if (result === DELETED) this.state.confirmedDelCount++;
      }
      else {
        // Counted once, then left behind. The cursor moves past it either way,
        // which is what stops an undeletable message from being re-found forever.
        this.state.failCount++;
      }

      this.calcEtr();
      if (this.onProgress) this.onProgress(this.state, this.stats);
    }
  }

  async deleteMessage(message) {
    let resp;
    try {
      resp = await this.request(`${API}/channels/${message.channel_id}/messages/${message.id}`, { method: 'DELETE' });
    } catch (err) {
      // No response at all (network error, timeout). Nothing updated the pacing
      // clock, so re-arm it by hand or the retries fire back to back.
      log.error('Delete request threw an error:', escapeHTML(err && err.message || err));
      this.stats.deleteNextAt = Date.now() + this.effectiveDelay('delete');
      return FAILED;
    }

    const { json, text } = await readBody(resp);

    if (isEdgeBlock(resp, json)) throw this.edgeBlocked();

    if (resp.ok) {
      this.updatePace('delete', resp);
      this.relax('delete');
      return DELETED;
    }

    const code = json && json.code;

    if (resp.status === 429) {
      // deleting messages too fast
      this.penalize('delete', MAX_DELETE_DELAY);
      const asked = retryAfterMs(resp, json);
      const w = (asked > 0 ? asked : clamp(this.effectiveDelay('delete'), 500, MAX_DELETE_DELAY)) + RETRY_MARGIN;
      this.stats.throttledCount++;
      this.stats.throttledTotalTime += w;
      log.warn(`Being rate limited by the API for ${w}ms! Slowing down deletions...`);
      this.printStats();
      // Retry-After is authoritative here, so gate the next attempt on it
      // directly instead of stacking another delay on top.
      this.stats.deleteNextAt = Date.now() + w;
      return RETRY;
    }

    // Someone (or a previous run) already deleted it. That is the outcome we
    // wanted, but it is not proof that this run is making progress — see the
    // sweep accounting in run().
    if (resp.status === 404 && code === 10008) {
      log.verb('That message was already gone.');
      this.updatePace('delete', resp);
      return ALREADY_GONE;
    }

    if (resp.status === 401) {
      throw new PurgecordError('Your authorization token is invalid or expired. Press "fill" to grab a fresh one.', { fatal: true, status: 401 });
    }

    // Documented as "Unknown Message", but a 403 carrying it means Discord's
    // anti-abuse systems blocked the request. Hammering it makes it worse.
    if (resp.status === 403 && code === 10008) {
      throw new PurgecordError('Discord blocked this request. Stopping — wait a while before trying again.', { fatal: true, status: 403, code });
    }

    this.updatePace('delete', resp);

    const reason = PERMANENT_DELETE_ERRORS[code];
    if (reason || resp.status === 403) {
      log.warn(`Skipping a message because ${reason || 'the API refused it'}.`, `<sup>{ID:${redact(message.id)}}</sup>`);
      return SKIPPED;
    }

    log.error(`Error deleting message, API responded with status ${resp.status}!`, escapeHTML(text));
    log.verb('Related object:', redact(JSON.stringify(message)));
    return FAILED;
  }

  /** All API traffic goes through here so pings and timeouts are handled once. */
  async request(url, init = {}) {
    this.beforeRequest();
    try {
      return await fetch(url, {
        ...init,
        headers: {
          'Authorization': this.options.authToken,
          ...init.headers,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
    } finally {
      this.afterRequest();
    }
  }

  edgeBlocked() {
    return new PurgecordError(
      'Blocked by Cloudflare — too many requests reached Discord\'s edge. ' +
      'Stop for a while (this can last up to 24h) and use larger delays next time.',
      { fatal: true, status: 429 }
    );
  }

  /** The delay we should currently keep between requests of a given kind. */
  effectiveDelay(kind) {
    const configured = kind === 'search' ? this.options.searchDelay : this.options.deleteDelay;
    const ceiling = kind === 'search' ? MAX_SEARCH_DELAY : MAX_DELETE_DELAY;
    const backoff = kind === 'search' ? this.stats.searchBackoff : this.stats.deleteBackoff;
    return clamp((Number(configured) || 0) + backoff, 0, ceiling);
  }

  /** Wait until we are allowed to issue the next request of this kind. */
  async pace(kind) {
    const due = kind === 'search' ? this.stats.searchNextAt : this.stats.deleteNextAt;
    await this.cooldown(due - Date.now());
  }

  /**
   * Sleep, but in slices, so pressing Stop during a multi-minute cooldown does
   * not leave the user staring at a frozen window.
   */
  async cooldown(ms) {
    const until = Date.now() + ms;
    for (;;) {
      const left = until - Date.now();
      if (left <= 0 || !this.state.running) return;
      await wait(Math.min(left, 1000));
    }
  }

  /**
   * Schedule the earliest time the next request of this kind may go out.
   * Discord only reliably sends bucket headers to bots, so they are used when
   * present and the configured delay carries the rest.
   */
  updatePace(kind, resp, extraWaitMs = 0) {
    let delay = this.effectiveDelay(kind);

    // Missing headers must not look like an empty bucket: Headers.get() returns
    // null when absent and Number(null) is 0.
    const remaining = resp.headers.get('x-ratelimit-remaining');
    const resetAfter = resp.headers.get('x-ratelimit-reset-after');
    if (remaining !== null && resetAfter !== null && Number(remaining) === 0) {
      const refillMs = Number(resetAfter) * 1000;
      // Bucket is empty: never issue the next request before it refills.
      if (Number.isFinite(refillMs)) delay = Math.max(delay, refillMs + RETRY_MARGIN);
    }

    const next = Date.now() + delay + extraWaitMs;
    if (kind === 'search') this.stats.searchNextAt = next;
    else this.stats.deleteNextAt = next;
  }

  /** Grow the adaptive backoff after being throttled. */
  penalize(kind, ceiling) {
    const current = kind === 'search' ? this.stats.searchBackoff : this.stats.deleteBackoff;
    const next = clamp(current * 2 + 500, 0, ceiling);
    if (kind === 'search') this.stats.searchBackoff = next;
    else this.stats.deleteBackoff = next;
  }

  /** Ease the backoff back down after a request that was not throttled. */
  relax(kind) {
    const current = kind === 'search' ? this.stats.searchBackoff : this.stats.deleteBackoff;
    const next = Math.max(0, current * 0.8 - 50);
    if (kind === 'search') this.stats.searchBackoff = next;
    else this.stats.deleteBackoff = next;
  }

  /** True while a run/batch is actually in flight. Unlike state.running it is
   * not cleared by resetState() or by the Stop button, so it is what re-entry
   * is guarded on. */
  #busy = false;

  #beforeTs = 0; // used to calculate latency
  beforeRequest() {
    this.#beforeTs = Date.now();
  }
  afterRequest() {
    this.stats.lastPing = (Date.now() - this.#beforeTs);
    this.stats.avgPing = this.stats.avgPing > 0 ? (this.stats.avgPing * 0.9) + (this.stats.lastPing * 0.1) : this.stats.lastPing;
  }

  printStats() {
    log.verb(
      `Delete delay: ${this.effectiveDelay('delete') | 0}ms, Search delay: ${this.effectiveDelay('search') | 0}ms`,
      `Last Ping: ${this.stats.lastPing}ms, Average Ping: ${this.stats.avgPing | 0}ms`,
    );
    log.verb(
      `Rate Limited: ${this.stats.throttledCount} times.`,
      `Total time throttled: ${msToHMS(this.stats.throttledTotalTime)}.`
    );
  }
}

export default PurgecordCore;
