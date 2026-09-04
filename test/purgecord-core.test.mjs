import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { rollup } from 'rollup';

globalThis.window = { location: { href: 'https://discord.com/channels/123/456' } };

async function importBundled(relativePath) {
  const bundle = await rollup({
    input: fileURLToPath(new URL(relativePath, import.meta.url)),
  });
  const { output } = await bundle.generate({ format: 'es' });
  await bundle.close();

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`;
  return import(moduleUrl);
}

const { default: PurgecordCore } = await importBundled('../src/purgecord-core.js');
const { buildPurgePlan } = await importBundled('../src/purgecord-plan.js');
const { getGuildIds, fetchGuildIds } = await importBundled('../src/utils/getIds.js');

function jsonResponse(status, body = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function historyMessage(id, authorId, content, overrides = {}) {
  return {
    id,
    channel_id: '44444444444444444',
    timestamp: '2019-01-01T00:00:00.000Z',
    content,
    type: 0,
    pinned: false,
    author: { id: authorId, username: 'tester' },
    attachments: [],
    embeds: [],
    flags: 0,
    ...overrides,
  };
}

function muteConsole() {
  const original = {
    debug: console.debug,
    error: console.error,
    info: console.info,
    log: console.log,
    warn: console.warn,
  };
  console.debug = console.error = console.info = console.log = console.warn = () => {};
  return () => Object.assign(console, original);
}

async function exerciseThreadRecovery(patchResponse) {
  const requests = [];
  let deleteAttempts = 0;
  const originalFetch = globalThis.fetch;
  const restoreConsole = muteConsole();

  globalThis.fetch = async (url, init = {}) => {
    const method = init.method || 'GET';
    requests.push({ url: String(url), method, headers: init.headers, body: init.body });

    if (method === 'DELETE') {
      deleteAttempts++;
      if (deleteAttempts === 1) {
        return jsonResponse(400, {
          code: 50083,
          message: 'Cannot execute action on an archived thread',
        });
      }
      return new Response(null, { status: 204 });
    }

    if (method === 'PATCH') return patchResponse;
    throw new Error(`Unexpected request: ${method} ${url}`);
  };


  try {
    const core = new PurgecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      deleteDelay: 0,
      maxAttempt: 2,
    };
    core.state.running = true;
    core.state.grandTotal = 1;
    core.state._messagesToDelete = [{
      id: 'message-1',
      channel_id: 'thread-1',
      timestamp: '2026-08-18T00:00:00.000Z',
      content: 'hello',
      author: { username: 'tester' },
      attachments: [],
      embeds: [],
      flags: 0,
    }];

    await core.deleteMessagesFromList();
    return { core, requests };
  } finally {
    globalThis.fetch = originalFetch;
    restoreConsole();
  }
}

test('reopens an archived thread and retries the deletion', async () => {
  const { core, requests } = await exerciseThreadRecovery(jsonResponse(200, {
    id: 'thread-1',
    thread_metadata: { archived: false },
  }));

  assert.deepEqual(requests.map(request => request.method), ['DELETE', 'PATCH', 'DELETE']);
  assert.equal(requests[1].url, 'https://discord.com/api/v9/channels/thread-1');
  assert.equal(requests[1].body, JSON.stringify({ archived: false }));
  assert.equal(requests[1].headers.Authorization, 'test-token');
  assert.equal(requests[1].headers['Content-Type'], 'application/json');
  assert.equal(core.state.delCount, 1);
  assert.equal(core.state.confirmedDelCount, 1);
  assert.equal(core.state.failCount, 0);
});

test('skips the message when the thread cannot be reopened', async () => {
  const { core, requests } = await exerciseThreadRecovery(jsonResponse(403, {
    code: 50013,
    message: 'Missing Permissions',
  }));

  assert.deepEqual(requests.map(request => request.method), ['DELETE', 'PATCH']);
  assert.equal(core.state.delCount, 0);
  assert.equal(core.state.failCount, 1);
});

test('plans one whole-server job per unique Server ID', () => {
  const firstGuild = '11111111111111111';
  const secondGuild = '22222222222222222';
  const plan = buildPurgePlan(`${firstGuild}, ${secondGuild} ${firstGuild}`, '');

  assert.deepEqual(plan.guildIds, [firstGuild, secondGuild]);
  assert.deepEqual(plan.channelIds, []);
  assert.deepEqual(plan.jobs, [
    { guildId: firstGuild, channelId: undefined },
    { guildId: secondGuild, channelId: undefined },
  ]);
});

test('rejects ambiguous or unsafe multi-server targets', () => {
  const firstGuild = '11111111111111111';
  const secondGuild = '22222222222222222';
  const channel = '33333333333333333';

  assert.throws(
    () => buildPurgePlan(`${firstGuild},${secondGuild}`, channel),
    /leave the "Channel ID" field empty/
  );
  assert.throws(
    () => buildPurgePlan(`@me,${firstGuild}`, ''),
    /cannot be combined/
  );
});

test('parses an empty target value without inventing a literal ID', () => {
  assert.throws(() => buildPurgePlan(undefined, ''), /fill the "Server ID" field/);
});

test('loads all server IDs from Discord\'s in-memory guild store', () => {
  const runtime = () => {};
  runtime.c = {
    guildStore: {
      exports: {
        default: {
          getGuild() {},
          getGuilds() {
            return {
              '11111111111111111': { id: '11111111111111111', name: 'One' },
              '22222222222222222': { id: '22222222222222222', name: 'Two' },
            };
          },
        },
      },
    },
  };
  window.webpackChunkdiscord_app = [];
  window.webpackChunkdiscord_app.push = ([, , load]) => load(runtime);

  try {
    assert.deepEqual(getGuildIds(), [
      '11111111111111111',
      '22222222222222222',
    ]);
  } finally {
    delete window.webpackChunkdiscord_app;
  }
});

test('loads all server IDs from Discord when the client store is unavailable', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  delete window.webpackChunkdiscord_app;

  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), headers: init.headers });
    return jsonResponse(200, [
      { id: '11111111111111111', name: 'One' },
      { id: '22222222222222222', name: 'Two' },
    ]);
  };

  try {
    assert.deepEqual(await fetchGuildIds('test-token'), [
      '11111111111111111',
      '22222222222222222',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(requests, [{
    url: 'https://discord.com/api/v9/users/@me/guilds?limit=200',
    headers: { Authorization: 'test-token' },
  }]);
});

test('does not retry a Cloudflare edge block while loading servers', async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  let errorLog = '';
  let requests = 0;
  console.error = (...args) => { errorLog += args.join(' '); };
  globalThis.fetch = async () => {
    requests++;
    return jsonResponse(429, { code: 40333, message: 'Cloudflare access denied' });
  };

  try {
    assert.deepEqual(await fetchGuildIds('test-token'), []);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }

  assert.equal(requests, 1);
  assert.match(errorLog, /Blocked by Cloudflare/);
});

test('runs each planned server as a separate whole-server search', async () => {
  const guildIds = ['11111111111111111', '22222222222222222'];
  const { jobs } = buildPurgePlan(guildIds.join(','), '');
  const originalFetch = globalThis.fetch;
  const requests = [];
  const restoreConsole = muteConsole();

  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method || 'GET' });
    return jsonResponse(200, { total_results: 0, messages: [] });
  };

  try {
    const core = new PurgecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId: '33333333333333333',
      searchDelay: 0,
      jobDelay: 0,
    };
    await core.runBatch(jobs);
  } finally {
    globalThis.fetch = originalFetch;
    restoreConsole();
  }

  assert.deepEqual(requests.map(request => {
    const url = new URL(request.url);
    return {
      method: request.method,
      pathname: url.pathname,
      channelId: url.searchParams.get('channel_id'),
    };
  }), [
    { method: 'GET', pathname: `/api/v9/guilds/${guildIds[0]}/messages/search`, channelId: null },
    { method: 'GET', pathname: `/api/v9/guilds/${guildIds[1]}/messages/search`, channelId: null },
  ]);
});

test('warns that one confirmation covers the remaining batch jobs', async () => {
  const originalFetch = globalThis.fetch;
  const originalConfirm = window.confirm;
  let prompt = '';
  const restoreConsole = muteConsole();

  globalThis.fetch = async () => jsonResponse(200, {
    total_results: 1,
    messages: [[{
      id: '44444444444444444',
      channel_id: '55555555555555555',
      timestamp: '2026-08-28T00:00:00.000Z',
      content: 'hello',
      type: 0,
      pinned: false,
      hit: true,
      author: { username: 'tester' },
      attachments: [],
      embeds: [],
      flags: 0,
    }]],
  });
  window.confirm = message => {
    prompt = message;
    return false;
  };

  try {
    const core = new PurgecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      searchDelay: 0,
      jobDelay: 0,
    };
    await core.runBatch([
      { guildId: '11111111111111111', channelId: undefined },
      { guildId: '22222222222222222', channelId: undefined },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    window.confirm = originalConfirm;
    restoreConsole();
  }

  assert.match(prompt, /job 1 of 2/);
  assert.match(prompt, /remaining jobs will continue without another confirmation/);
});

test('walks group DM history past non-matching pages and deletes only exact matches', async () => {
  const channelId = '44444444444444444';
  const authorId = '33333333333333333';
  const requests = [];
  const originalFetch = globalThis.fetch;
  const originalConfirm = window.confirm;
  const restoreConsole = muteConsole();
  let prompt = '';

  globalThis.fetch = async (url, init = {}) => {
    const parsed = new URL(url);
    const method = init.method || 'GET';
    requests.push({ method, pathname: parsed.pathname, before: parsed.searchParams.get('before') });

    if (method === 'DELETE') return new Response(null, { status: 204 });
    if (parsed.pathname === `/api/v9/channels/${channelId}`) return jsonResponse(200, { id: channelId, type: 3 });
    if (parsed.pathname !== `/api/v9/channels/${channelId}/messages`) throw new Error(`Unexpected request: ${url}`);

    const before = parsed.searchParams.get('before');
    if (!before) {
      return jsonResponse(200, [
        historyMessage('90000000000000000', '22222222222222222', 'needle https://example.com', { attachments: [{ id: '1' }] }),
        historyMessage('80000000000000000', authorId, 'does not match'),
      ]);
    }
    if (before === '80000000000000000') {
      return jsonResponse(200, [
        historyMessage('70000000000000000', authorId, 'needle https://example.com', { attachments: [{ id: '2' }] }),
      ]);
    }
    if (before === '70000000000000000') return jsonResponse(200, []);
    throw new Error(`Unexpected cursor: ${before}`);
  };
  window.confirm = message => {
    prompt = message;
    return true;
  };

  let core;
  try {
    core = new PurgecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId,
      guildId: '@me',
      channelId,
      content: 'needle',
      hasLink: true,
      hasFile: true,
      pattern: '^needle',
      searchDelay: 0,
      deleteDelay: 0,
    };
    await core.run();
  } finally {
    globalThis.fetch = originalFetch;
    window.confirm = originalConfirm;
    restoreConsole();
  }

  assert.deepEqual(requests, [
    { method: 'GET', pathname: `/api/v9/channels/${channelId}`, before: null },
    { method: 'GET', pathname: `/api/v9/channels/${channelId}/messages`, before: null },
    { method: 'GET', pathname: `/api/v9/channels/${channelId}/messages`, before: '80000000000000000' },
    { method: 'DELETE', pathname: `/api/v9/channels/${channelId}/messages/70000000000000000`, before: null },
    { method: 'GET', pathname: `/api/v9/channels/${channelId}/messages`, before: '70000000000000000' },
  ]);
  assert.equal(core.state.delCount, 1);
  assert.equal(core.state.failCount, 0);
  assert.equal(core.state.historyScanned, 3);
  assert.match(prompt, /scan this entire chat history/);
  assert.match(prompt, /final total is unknown/);
  assert.equal(requests.some(request => request.pathname.endsWith('/search')), false);
});

test('applies DM message bounds and stops once the lower bound is crossed', async () => {
  const channelId = '44444444444444444';
  const authorId = '33333333333333333';
  const requests = [];
  const originalFetch = globalThis.fetch;
  const originalConfirm = window.confirm;
  const restoreConsole = muteConsole();

  globalThis.fetch = async (url, init = {}) => {
    const parsed = new URL(url);
    const method = init.method || 'GET';
    requests.push({ method, pathname: parsed.pathname, before: parsed.searchParams.get('before') });
    if (method === 'DELETE') return new Response(null, { status: 204 });
    if (parsed.pathname === `/api/v9/channels/${channelId}`) return jsonResponse(200, { id: channelId, type: 1 });
    return jsonResponse(200, [
      historyMessage('90000000000000000', authorId, 'inside range'),
      historyMessage('70000000000000000', authorId, 'below range'),
    ]);
  };
  window.confirm = () => true;

  try {
    const core = new PurgecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId,
      guildId: '@me',
      channelId,
      minId: '75000000000000000',
      maxId: '95000000000000000',
      searchDelay: 0,
      deleteDelay: 0,
    };
    await core.run();
  } finally {
    globalThis.fetch = originalFetch;
    window.confirm = originalConfirm;
    restoreConsole();
  }

  assert.deepEqual(requests, [
    { method: 'GET', pathname: `/api/v9/channels/${channelId}`, before: null },
    { method: 'GET', pathname: `/api/v9/channels/${channelId}/messages`, before: '95000000000000000' },
    { method: 'DELETE', pathname: `/api/v9/channels/${channelId}/messages/90000000000000000`, before: null },
  ]);
});

test('refuses to reinterpret a guild archive entry as a private chat', async () => {
  const channelId = '44444444444444444';
  const originalFetch = globalThis.fetch;
  const restoreConsole = muteConsole();
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method || 'GET' });
    return jsonResponse(200, { id: channelId, type: 0 });
  };

  try {
    const core = new PurgecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId: '33333333333333333',
      guildId: '@me',
      channelId,
      searchDelay: 0,
    };
    await core.run();
  } finally {
    globalThis.fetch = originalFetch;
    restoreConsole();
  }

  assert.deepEqual(requests, [{
    url: `https://discord.com/api/v9/channels/${channelId}`,
    method: 'GET',
  }]);
});

test('plans imported DMs and group DMs as separate private-channel jobs', () => {
  const firstChannel = '44444444444444444';
  const secondChannel = '55555555555555555';
  assert.deepEqual(buildPurgePlan('@me', `${firstChannel},${secondChannel}`).jobs, [
    { guildId: '@me', channelId: firstChannel },
    { guildId: '@me', channelId: secondChannel },
  ]);
});

test('requires an author before reading any private-channel history', async () => {
  const originalFetch = globalThis.fetch;
  const restoreConsole = muteConsole();
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error('Private history must not be requested without an author');
  };

  try {
    const core = new PurgecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId: '',
      guildId: '@me',
      channelId: '44444444444444444',
    };
    await core.run();
  } finally {
    globalThis.fetch = originalFetch;
    restoreConsole();
  }

  assert.equal(requests, 0);
});
