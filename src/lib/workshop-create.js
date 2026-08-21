const EXPO_TEMPLATE_NAME = 'Expo app';
const PROJECT_NAME_WORD_LIMIT = 5;
const PROJECT_NAME_CHARACTER_LIMIT = 48;

export function expoTemplateFrom(templates) {
  if (!Array.isArray(templates)) throw new Error('Your template catalog is unavailable.');
  const template = templates.find((candidate) => candidate.display_name === EXPO_TEMPLATE_NAME);
  if (!template?.clone_url) throw new Error('Your workspace does not offer the Expo app template.');
  return template;
}

export function projectNameFromPrompt(prompt) {
  const normalized = requiredPrompt(prompt)
    .replace(/^(build|create|make|design)\s+(me\s+)?/i, '')
    .replace(/[.!?].*$/, '')
    .trim();
  const words = normalized.split(/\s+/).slice(0, PROJECT_NAME_WORD_LIMIT);
  const name = words.join(' ').slice(0, PROJECT_NAME_CHARACTER_LIMIT).trim();
  if (!name) throw new Error('Describe the app you want to create.');
  return `${name[0].toUpperCase()}${name.slice(1)}`;
}

export function mobileAgentPrompt(prompt) {
  const request = requiredPrompt(prompt);
  return [
    'Build the first complete version of this app in the existing Expo project.',
    'Keep the first version compatible with Expo Web and Expo Go. Prefer Expo SDK or JavaScript-only dependencies, and make the interface feel native on both iOS and Android.',
    `User request: ${request}`
  ].join('\n\n');
}

function requiredPrompt(prompt) {
  const value = typeof prompt === 'string' ? prompt.trim() : '';
  if (!value) throw new Error('Describe the app you want to create.');
  return value;
}
