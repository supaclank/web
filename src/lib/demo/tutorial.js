export const CLANK_APP_BASE_URL = 'https://supaclank.com';

export const DEFAULT_REPO_SLUG = 'supaclank/web';

export const START_COMMANDS = [
  'brew install supaclank/tap/clank',
  'cd path/to/your-project',
  'clank preview'
];

export const KEYBINDS = [
  { keys: '⌘E / Ctrl+E', action: 'Open' },
  { keys: 'Hold ⌘ / Ctrl', action: 'Point' },
  { keys: 'Caps Lock', action: 'Talk' },
  { keys: 'Hold Shift', action: 'Move' },
  { keys: 'Esc', action: 'Hide' }
];

export const OVERLAY_STEPS = [
  'Press ⌘E to open the overlay',
  'Hold ⌘ and click to select',
  'Tap Caps Lock to talk',
  'Hold ⇧ Shift to move the overlay'
];
