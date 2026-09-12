import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

export async function checkNodeLifecycle(tab) {
  await tab.playwright.getByRole('button', { name: 'Replay demo', exact: true }).click();
  await tab.playwright.getByRole('button', { name: 'Pause demo', exact: true }).click();
  await tab.getAXState({ emit: false });
  const code = tab.playwright.locator('.svelte-flow__node[data-id="code"]');
  const preview = tab.playwright.locator('.svelte-flow__node[data-id="preview"]');
  assert.equal(await code.count(), 0, 'No worktree before submission.');
  assert.equal(await preview.count(), 0, 'No preview before startup.');
  const next = tab.playwright.getByRole('button', { name: 'Next action →', exact: true });
  await next.click();
  await tab.getAXState({ emit: false });
  assert.equal(await code.count(), 1, 'Submission creates the code node.');
  assert.equal(await preview.count(), 0);
  for (let stage = 1; stage <= 4; stage++) {
    await next.click();
    await tab.getAXState({ emit: false });
    assert.equal(await preview.count(), 0, 'Editing and checks do not create the preview.');
  }
  await next.click();
  await tab.getAXState({ emit: false });
  assert.equal(await preview.count(), 1, 'Preview startup creates the preview node.');
  return 'Replay hides outputs; submission creates code; preview startup creates preview.';
}

export async function checkSessionChat(tab, id, title) {
  const viewport = tab.playwright.locator('.demo-flow .svelte-flow__viewport');
  const before = await viewport.getAttribute('style');
  await tab.playwright.locator(`.svelte-flow__node[data-id="${id}"] .session-summary`).click();
  await tab.getAXState({ emit: false });
  assert.ok(await tab.playwright.getByRole('region', { name: `Session chat: ${title}`, exact: true }).isVisible());
  assert.ok(await tab.playwright.getByRole('log', { name: `Conversation: ${title}`, exact: true }).isVisible());
  assert.equal(await viewport.getAttribute('style'), before, 'Opening the corresponding conversation does not move the camera.');
  return 'The selected session opens its own chat without moving the canvas.';
}

export async function checkSessionContinuation(tab) {
  const counts = { code: await tab.playwright.locator('.svelte-flow__node-code').count(), preview: await tab.playwright.locator('.svelte-flow__node-preview').count() };
  await tab.playwright.getByRole('textbox', { name: 'Message session', exact: true }).fill('Make the weekly view more compact');
  await tab.playwright.getByRole('button', { name: 'Send to session', exact: true }).click();
  await tab.getAXState({ emit: false });
  assert.equal(await tab.playwright.locator('.svelte-flow__node-code').count(), counts.code);
  assert.equal(await tab.playwright.locator('.svelte-flow__node-preview').count(), counts.preview);
  assert.ok((await tab.playwright.locator('.session-transcript').textContent()).includes('Make the weekly view more compact'));
  const deadline = Date.now() + 10000;
  while (!(await tab.playwright.getByRole('textbox', { name: 'Message session', exact: true }).isEnabled()) && Date.now() < deadline) await delay(100);
  assert.ok(await tab.playwright.getByRole('textbox', { name: 'Message session', exact: true }).isEnabled());
  return 'Session follow-ups keep the same worktree, preserve chat, and complete their work steps.';
}

export async function checkIncrementalDiff(tab) {
  const before = await tab.playwright.evaluate(() => ({ rows: document.querySelectorAll('[data-id="code"] .demo-diff-stat').length, height: document.querySelector('[data-id="code"] .demo-code').getBoundingClientRect().height }));
  await tab.playwright.getByRole('button', { name: 'Next action →', exact: true }).click();
  await tab.getAXState({ emit: false });
  const deadline = Date.now() + 1500;
  let after;
  do {
    after = await tab.playwright.evaluate(() => ({ rows: document.querySelectorAll('[data-id="code"] .demo-diff-stat').length, height: document.querySelector('[data-id="code"] .demo-code').getBoundingClientRect().height }));
    if (after.height > before.height + 10) break;
    await delay(50);
  } while (Date.now() < deadline);
  assert.equal(after.rows, before.rows + 1, 'The next edit adds one file to the diff.');
  assert.ok(after.height > before.height + 10, 'The code node grows as the diff arrives.');
  return 'The diff adds files incrementally and animates the node height.';
}
