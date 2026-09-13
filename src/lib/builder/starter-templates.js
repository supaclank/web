import { BUILD_TARGET } from '../onboarding/preferences.js';

const STARTERS = Object.freeze({
  [BUILD_TARGET.web]: Object.freeze({ display_name: 'Svelte', clone_url: 'https://github.com/supaclank/svelte-starter-template.git' }),
  [BUILD_TARGET.mobile]: Object.freeze({ display_name: 'Expo', clone_url: 'https://github.com/supaclank/expo-56-starter-template.git' }),
});

export function starterForShortcut(shortcut) {
  const template = STARTERS[shortcut];
  if (!Object.hasOwn(STARTERS, shortcut)) throw new Error('Unknown starter shortcut.');
  return template;
}
