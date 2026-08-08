import assert from 'node:assert/strict';
import { test } from 'bun:test';

import { firstPartyClientId, authorizationClientId } from './oauth-first-party.js';

function jsonResponse(body, ok = true) {
  return { ok, json: async () => body };
}

test('firstPartyClientId reads client_id from the gateway discovery payload', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    return jsonResponse({ client_id: 'abc-123', authorize_endpoint: 'x', token_endpoint: 'y' });
  };
  assert.equal(await firstPartyClientId('https://gw.supaclank.com', fetcher), 'abc-123');
  assert.equal(calls[0].url, 'https://gw.supaclank.com/auth-config');
  assert.equal(calls[0].init.headers.Accept, 'application/json');
});

test('firstPartyClientId trims trailing slashes off the gateway URL', async () => {
  const fetcher = async (url) => {
    assert.equal(url, 'http://supaclank.test:18080/auth-config');
    return jsonResponse({ client_id: 'abc' });
  };
  assert.equal(await firstPartyClientId('http://supaclank.test:18080//', fetcher), 'abc');
});

test('firstPartyClientId returns "" without fetching when the URL is unset', async () => {
  const fetcher = async () => {
    throw new Error('must not be called');
  };
  assert.equal(await firstPartyClientId('', fetcher), '');
  assert.equal(await firstPartyClientId('   ', fetcher), '');
  assert.equal(await firstPartyClientId(undefined, fetcher), '');
});

test('firstPartyClientId returns "" on HTTP errors', async () => {
  assert.equal(await firstPartyClientId('https://gw', async () => jsonResponse({}, false)), '');
});

test('firstPartyClientId returns "" when the request throws', async () => {
  const fetcher = async () => {
    throw new TypeError('network down');
  };
  assert.equal(await firstPartyClientId('https://gw', fetcher), '');
});

test('firstPartyClientId returns "" on malformed payloads', async () => {
  assert.equal(await firstPartyClientId('https://gw', async () => jsonResponse({})), '');
  assert.equal(await firstPartyClientId('https://gw', async () => jsonResponse({ client_id: 42 })), '');
  assert.equal(await firstPartyClientId('https://gw', async () => jsonResponse(null)), '');
  const badJson = async () => ({
    ok: true,
    json: async () => {
      throw new SyntaxError('bad json');
    }
  });
  assert.equal(await firstPartyClientId('https://gw', badJson), '');
});

test('authorizationClientId reads client.id and tolerates missing shapes', () => {
  assert.equal(authorizationClientId({ client: { id: 'abc-123', name: 'Clank' } }), 'abc-123');
  assert.equal(authorizationClientId({}), '');
  assert.equal(authorizationClientId(null), '');
  assert.equal(authorizationClientId({ client: {} }), '');
  assert.equal(authorizationClientId({ client: { id: 7 } }), '');
});
