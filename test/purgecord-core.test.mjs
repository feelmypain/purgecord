import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { rollup } from 'rollup';

globalThis.window = { location: { href: 'https://discord.com/channels/123/456' } };

const bundle = await rollup({
  input: fileURLToPath(new URL('../src/purgecord-core.js', import.meta.url)),
});
const { output } = await bundle.generate({ format: 'es' });
await bundle.close();

const coreModuleUrl = `data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`;
const { default: PurgecordCore } = await import(coreModuleUrl);

function jsonResponse(status, body = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function exerciseThreadRecovery(patchResponse) {
  const requests = [];
  let deleteAttempts = 0;
  const originalFetch = globalThis.fetch;
  const originalConsole = {
    debug: console.debug,
    error: console.error,
    info: console.info,
    log: console.log,
    warn: console.warn,
  };

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

  console.debug = console.error = console.info = console.log = console.warn = () => {};

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
    Object.assign(console, originalConsole);
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
