import assert from 'node:assert/strict';
import { test } from 'bun:test';

import { githubRepositoryFrom, previewTitle, relativePreviewAge } from './workshop.js';

test('githubRepositoryFrom accepts a slug and a GitHub URL', () => {
  assert.deepEqual(githubRepositoryFrom('supaclank/web'), {
    owner: 'supaclank',
    repo: 'web'
  });
  assert.deepEqual(githubRepositoryFrom('https://github.com/supaclank/web.git'), {
    owner: 'supaclank',
    repo: 'web'
  });
});

test('githubRepositoryFrom rejects other hosts and incomplete slugs', () => {
  assert.throws(() => githubRepositoryFrom('https://example.com/supaclank/web'), /github.com/);
  assert.throws(() => githubRepositoryFrom('supaclank'), /owner\/repository/);
  assert.throws(() => githubRepositoryFrom(''), /Enter/);
});

test('preview helpers produce human labels from gateway-only data', () => {
  assert.equal(previewTitle({ service_name: 'storybook' }), 'storybook');
  assert.equal(previewTitle({ service_name: 'default' }), 'Web preview');
  assert.equal(
    relativePreviewAge('2026-08-21T10:00:00Z', new Date('2026-08-21T12:12:00Z')),
    'Created 2h ago'
  );
});
