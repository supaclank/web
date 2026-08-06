import assert from 'node:assert/strict';
import { test } from 'bun:test';

import { FREE_AI_CHOICE } from './free-ai.js';

test('credential-free AI selects OpenCode without pinning its model', () => {
  assert.deepEqual(FREE_AI_CHOICE, {
    provider_id: 'opencode',
    backend: 'opencode',
    display_name: 'OpenCode',
    current_model_name: 'Big Pickle'
  });
  assert.equal('model' in FREE_AI_CHOICE, false);
  assert.equal('model_id' in FREE_AI_CHOICE, false);
});
