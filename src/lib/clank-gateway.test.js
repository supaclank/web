import assert from 'node:assert/strict';
import { test } from 'bun:test';

import { ClankGateway, GatewayError } from './clank-gateway.js';

test('gateway requests carry the Supabase bearer and exact approved SHA', async () => {
  let captured;
  const gateway = new ClankGateway('https://api.supaclank.com/', 'jwt-value', async (url, init) => {
    captured = { url, init };
    return Response.json({ worktree_id: '01WORKTREE' });
  });

  const request = {
    owner: 'Acksell', repo: 'supaclank', number: 51, expected_head_sha: 'abc123'
  };
  const response = await gateway.launchPullRequest(request);

  assert.equal(captured.url, 'https://api.supaclank.com/v1/github/pull-requests/launch');
  assert.equal(captured.init.headers.Authorization, 'Bearer jwt-value');
  assert.deepEqual(JSON.parse(captured.init.body), request);
  assert.equal(response.worktree_id, '01WORKTREE');
});

test('repository launch sends only the validated GitHub locator', async () => {
  let captured;
  const gateway = new ClankGateway('https://api.supaclank.com', 'jwt-value', async (url, init) => {
    captured = { url, init };
    return Response.json({ worktree_id: '01WORKTREE', branch: 'calm-otter' });
  });

  const locator = { owner: 'Acksell', repo: 'supaclank' };
  await gateway.launchRepository(locator);

  assert.equal(captured.url, 'https://api.supaclank.com/v1/github/repositories/launch');
  assert.deepEqual(JSON.parse(captured.init.body), locator);
});

test('gateway errors preserve machine code and setup details', async () => {
  const gateway = new ClankGateway('https://api.supaclank.com', 'jwt-value', async () =>
    Response.json(
      { code: 'preview_setup_required', error: 'setup required', setup_prompt: 'write launch config' },
      { status: 409 }
    )
  );

  await assert.rejects(
    gateway.previewStart('01WORKTREE'),
    (error) => error instanceof GatewayError &&
      error.status === 409 &&
      error.code === 'preview_setup_required' &&
      error.details.setup_prompt === 'write launch config'
  );
});

test('signed preview carries the editing backend without reusing a setup session', async () => {
  let captured;
  const gateway = new ClankGateway('https://api.supaclank.com', 'jwt-value', async (url, init) => {
    captured = { url, init };
    return Response.json({ signed_url: 'https://preview.example' });
  });

  await gateway.signPreviewToken('preview-token', 'claude-code');

  assert.equal(captured.url, 'https://api.supaclank.com/v1/preview/tokens/preview-token/sign');
  assert.deepEqual(JSON.parse(captured.init.body), {
    ttl: '24h',
    backend: 'claude-code'
  });
});
