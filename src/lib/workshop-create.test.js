import assert from 'node:assert/strict';
import { test } from 'bun:test';

import { expoTemplateFrom, mobileAgentPrompt, projectNameFromPrompt } from './workshop-create.js';

test('Expo creation selects the configured builtin template', () => {
  const templates = [
    { display_name: 'Web app', clone_url: 'https://templates.example/web.git' },
    { display_name: 'Expo app', clone_url: 'https://templates.example/expo.git' }
  ];

  assert.deepEqual(expoTemplateFrom(templates), templates[1]);
  assert.throws(() => expoTemplateFrom([]), /does not offer the Expo app template/);
});

test('project names come from the request without keeping command filler', () => {
  assert.equal(projectNameFromPrompt('Build me a calmer habit tracker with plants and streaks.'), 'A calmer habit tracker with');
  assert.equal(projectNameFromPrompt('  Recipe camera  '), 'Recipe camera');
  assert.throws(() => projectNameFromPrompt('   '), /Describe the app/);
});

test('mobile build prompt makes the browser and native compatibility boundary explicit', () => {
  const prompt = mobileAgentPrompt('A shared grocery list for roommates');

  assert.match(prompt, /Expo Web and Expo Go/);
  assert.match(prompt, /iOS and Android/);
  assert.match(prompt, /User request: A shared grocery list for roommates/);
});
