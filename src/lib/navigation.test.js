import assert from 'node:assert/strict';
import test from 'node:test';

import { pullRequestPath, repositoryPath, safeReturnTo } from './navigation.js';

test('safeReturnTo preserves a local pull-request destination', () => {
  assert.equal(
    safeReturnTo('/Acksell/supaclank/pull/51?from=github#preview'),
    '/Acksell/supaclank/pull/51?from=github#preview'
  );
});

test('safeReturnTo rejects external and protocol-relative destinations', () => {
  for (const value of [
    'https://evil.example/steal',
    '//evil.example/steal',
    '/\\evil.example/steal',
    'javascript:alert(1)',
    ''
  ]) {
    assert.equal(safeReturnTo(value), '/welcome', value);
  }
});

test('pullRequestPath accepts only a positive integer pull request number', () => {
  assert.equal(pullRequestPath('Acksell', 'supaclank', '51'), '/Acksell/supaclank/pull/51');
  assert.throws(() => pullRequestPath('Acksell', 'supaclank', '0'));
  assert.throws(() => pullRequestPath('Acksell', 'supaclank', '1.5'));
});

test('repositoryPath encodes both GitHub path segments', () => {
  assert.equal(repositoryPath('Acksell', 'supaclank'), '/Acksell/supaclank');
  assert.equal(repositoryPath('org name', 'repo/name'), '/org%20name/repo%2Fname');
  assert.throws(() => repositoryPath('', 'supaclank'));
});
