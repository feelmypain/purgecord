import { log } from './log';
import { isSnowflake } from './helpers';

/** Discord encrypts the stored token in the desktop app; that value is unusable here. */
const ENCRYPTED_TOKEN_PREFIX = 'dQw4w9WgXcQ:';
const API = new URL('/api/v9', window.location.href).href;
const REQUEST_TIMEOUT = 30000;

/**
 * Discord deletes window.localStorage, but only the window reference — the
 * origin's storage is untouched, so a throwaway same-origin iframe still
 * exposes it.
 */
function readLocalStorage(keys) {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  try {
    const storage = iframe.contentWindow.localStorage;
    const values = {};
    for (const key of keys) values[key] = storage[key];
    return values; // read before the frame is detached, contentWindow dies with it
  } catch (err) {
    log.verb('Could not read local storage:', err);
    return {};
  } finally {
    iframe.remove();
  }
}

function parseStored(raw) {
  if (raw === undefined || raw === null) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function looksLikeToken(token) {
  return typeof token === 'string' && token.length > 0 && !token.startsWith(ENCRYPTED_TOKEN_PREFIX);
}

/**
 * Walk Discord's webpack module cache looking for a module that can hand us
 * something. Used as a fallback because Discord removes the token from local
 * storage whenever DevTools is open.
 */
function fromWebpack(pick) {
  const chunks = window.webpackChunkdiscord_app;
  if (!chunks || typeof chunks.push !== 'function') return null;

  let found = null;
  try {
    // A unique chunk id, so we can never collide with a real one and mark it
    // as already installed (which breaks the client).
    chunks.push([[Symbol('purgecord')], {}, (require) => {
      let modules;
      try { modules = Object.values(require.c || {}); } catch { return; }
      for (const module of modules) {
        try {
          const value = pick(module && module.exports);
          if (value) { found = value; return; }
        } catch { /* individual module getters can throw */ }
      }
    }]);
  } catch (err) {
    log.verb('Webpack lookup failed:', err);
  } finally {
    chunks.pop(); // don't leave our fake chunk behind
  }
  return found;
}

export function getToken() {
  const stored = parseStored(readLocalStorage(['token']).token);
  if (looksLikeToken(stored)) return stored;

  log.info('Could not read the Authorization Token from local storage, trying webpack...');
  // The token module exports getToken directly; the auth store exposes it on
  // default. Other modules (i18n) also have a getToken that returns an object,
  // hence the string check.
  const token = fromWebpack(exports => {
    if (!exports) return null;
    const source = (typeof exports.getToken === 'function' && exports)
      || (exports.default && typeof exports.default.getToken === 'function' && exports.default);
    if (!source) return null;
    const value = source.getToken();
    return looksLikeToken(value) ? value : null;
  });

  if (!token) throw new Error('Could not find the Authorization Token.');
  return token;
}

export function getAuthorId() {
  const cached = parseStored(readLocalStorage(['user_id_cache']).user_id_cache);
  if (isSnowflake(cached)) return String(cached);

  const fromStore = fromWebpack(exports => {
    const store = exports && exports.default;
    if (!store || typeof store.getId !== 'function' || typeof store.getToken !== 'function') return null;
    const id = store.getId();
    return isSnowflake(id) ? String(id) : null;
  });
  if (fromStore) return fromStore;

  log.error('Could not detect your User ID, please fill the "Author ID" field manually.');
  return '';
}

function guildIdsFrom(value) {
  const guilds = Array.isArray(value) ? value : Object.values(value || {});
  return [...new Set(guilds
    .map(guild => guild && String(guild.id))
    .filter(isSnowflake))];
}

/** Return server IDs already held by Discord's in-memory guild store. */
export function getGuildIds() {
  return fromWebpack(exports => {
    const candidates = [exports, exports && exports.default, exports && exports.Z, exports && exports.ZP];
    for (const store of candidates) {
      if (!store || typeof store.getGuild !== 'function' || typeof store.getGuilds !== 'function') continue;
      const ids = guildIdsFrom(store.getGuilds());
      if (ids.length) return ids;
    }
    return null;
  }) || [];
}

/** Fall back to Discord's current-user guild endpoint when the store moved. */
export async function fetchGuildIds(authToken) {
  if (!looksLikeToken(authToken)) return [];

  let resp;
  try {
    resp = await fetch(`${API}/users/@me/guilds?limit=200`, {
      headers: { 'Authorization': authToken },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
  } catch (err) {
    log.error('Could not load your servers:', err && err.message || err);
    return [];
  }

  let data;
  try { data = await resp.json(); } catch { data = null; }


  if ((data && data.code === 40333) || (resp.status === 429 && !data)) {
    log.error('Blocked by Cloudflare — stop for a while before making more Discord requests.');
    return [];
  }
  if (!resp.ok) {
    if (resp.status === 429) {
      const retryAfter = Number(data && data.retry_after);
      const suffix = Number.isFinite(retryAfter) && retryAfter > 0 ? ` Try again in ${retryAfter.toFixed(1)}s.` : '';
      log.warn(`Discord rate limited the server list request.${suffix}`);
    }
    else if (resp.status === 401) log.error('Your Authorization Token is invalid or expired.');
    else log.error(`Could not load your servers; Discord responded with status ${resp.status}.`);
    return [];
  }

  const ids = guildIdsFrom(data);
  if (!ids.length) log.warn('Discord did not return any servers for this account.');
  return ids;
}

export function getGuildId() {
  const m = location.href.match(/channels\/([\w@]+)\/(\d+)/);
  if (m) return m[1];
  alert('Could not find the Guild ID!\nPlease make sure you are on a Server or DM.');
  return '';
}

export function getChannelId() {
  const m = location.href.match(/channels\/([\w@]+)\/(\d+)/);
  if (m) return m[2];
  alert('Could not find the Channel ID!\nPlease make sure you are on a Channel or DM.');
  return '';
}

export function fillToken() {
  try {
    return getToken();
  } catch (err) {
    log.verb(err);
    log.error('Could not automatically detect Authorization Token!');
    log.info('Please make sure Purgecord is up to date');
    log.debug('Alternatively, you can try entering a Token manually in the "Advanced Settings" section.');
  }
  return '';
}
