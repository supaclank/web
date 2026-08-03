import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { isSupaclankPreviewHostname } from './preview-host.js';
import {
  CLANK_APP_BASE_URL,
  DEFAULT_REPO_SLUG,
  KEYBINDS,
  OVERLAY_STEPS,
  START_COMMANDS
} from './tutorial.js';

const launchConfigURL = new URL('../../../.clank/launch.yaml', import.meta.url);

test('local setup uses Homebrew and Clank preview', () => {
  assert.deepEqual(START_COMMANDS, [
    'brew install supaclank/tap/clank',
    'cd path/to/your-project',
    'clank preview'
  ]);
});

test('Clank launches the production frontend', async () => {
  const launchConfig = await readFile(launchConfigURL, 'utf8');

  assert.match(launchConfig, /npm ci && npm run dev/);
  assert.match(launchConfig, /ready:\n\s+path: \/demo/);
});

test('tutorial contains the essential overlay keybinds', () => {
  const keys = KEYBINDS.map((keybind) => keybind.keys).join(' ');

  assert.match(keys, /⌘E/);
  assert.match(keys, /Ctrl/);
  assert.match(keys, /Caps Lock/);
  assert.match(keys, /Shift/);
  assert.match(keys, /Esc/);
});

test('tutorial presents a short unique overlay flow', () => {
  assert.equal(OVERLAY_STEPS.length, 4);
  assert.equal(new Set(OVERLAY_STEPS).size, OVERLAY_STEPS.length);
});

test('tutorial opens the production web repository', () => {
  const url = new URL(`${CLANK_APP_BASE_URL}/${DEFAULT_REPO_SLUG}`);

  assert.equal(url.hostname, 'supaclank.com');
  assert.equal(url.pathname, '/supaclank/web');
});

test('launcher is hidden only on Supaclank preview hosts', () => {
  assert.equal(isSupaclankPreviewHostname('supaclank.dev'), true);
  assert.equal(isSupaclankPreviewHostname('demo.supaclank.dev'), true);
  assert.equal(isSupaclankPreviewHostname('supaclank.com'), false);
  assert.equal(isSupaclankPreviewHostname('localhost'), false);
});
