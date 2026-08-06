import assert from 'node:assert/strict';
import { test } from 'bun:test';

import {
  defaultPresetFor,
  groupProviderChoices,
  launchRequestForApprovedRevision,
  onlyConnectedProvider,
  pollUntil
} from './pull-request-preview.js';

const inspection = {
  owner: 'Acksell', repo: 'supaclank', number: 51, author: 'Acksell', head_sha: 'abc123'
};

test('launch request is bound to the explicitly approved revision', () => {
  assert.throws(() => launchRequestForApprovedRevision(inspection, false), /explicitly trusted/);
  assert.deepEqual(launchRequestForApprovedRevision(inspection, true), {
    owner: 'Acksell', repo: 'supaclank', number: 51, expected_head_sha: 'abc123'
  });
});

test('defaultPresetFor requires the backend built-in preset by stable id', () => {
  const presets = [
    { id: 'user-build', backend: 'opencode', config: { mode: 'build' } },
    { id: 'builtin-default-opencode', backend: 'opencode', config: { mode: 'build' } }
  ];
  assert.equal(defaultPresetFor(presets, 'opencode').id, 'builtin-default-opencode');
  assert.throws(() => defaultPresetFor(presets, 'claude-code'), /no built-in Build preset/);
});

test('onlyConnectedProvider auto-selects only an unambiguous backend', () => {
  const connected = { provider_id: 'claude', backend: 'claude-code', connected: true };
  const disconnected = { provider_id: 'codex', backend: 'codex', connected: false };

  assert.equal(onlyConnectedProvider([connected, disconnected]), connected);
  assert.equal(onlyConnectedProvider([connected, { ...connected, provider_id: 'other' }]), connected);
  assert.equal(onlyConnectedProvider([connected, { ...connected, provider_id: 'codex', backend: 'codex' }]), null);
  assert.equal(onlyConnectedProvider([disconnected]), null);
});

test('groupProviderChoices keeps connected providers visible and filters the collapsed catalog', () => {
  const providers = [
    { provider_id: 'anthropic', display_name: 'Anthropic', backend: 'claude-code', connected: true },
    { provider_id: 'github-copilot', display_name: 'GitHub Copilot', backend: 'opencode', connected: false },
    { provider_id: 'openai', display_name: 'OpenAI', backend: 'codex', connected: false }
  ];

  assert.deepEqual(groupProviderChoices(providers, 'github'), {
    connected: [providers[0]],
    available: [providers[1]]
  });
  assert.deepEqual(groupProviderChoices(providers, '').available, providers.slice(1));
});

test('pollUntil reports intermediate values and returns the terminal value', async () => {
  const values = [{ state: 'starting' }, { state: 'running' }];
  const seen = [];
  const result = await pollUntil(
    async () => values.shift(),
    (value) => value.state === 'running',
    { sleep: async () => {}, onValue: (value) => seen.push(value.state) }
  );
  assert.equal(result.state, 'running');
  assert.deepEqual(seen, ['starting', 'running']);
});

test('pollUntil stops issuing requests once its signal is aborted', async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(
    pollUntil(
      async () => { calls += 1; return { state: 'pending' }; },
      () => false,
      { sleep: async () => controller.abort(), signal: controller.signal }
    ),
    /Aborted/
  );
  assert.equal(calls, 1);
});
