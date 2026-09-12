import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

async function until(predicate, message, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await delay(250);
  }
  assert.fail(message);
}

// Run against the live local page through the computer-use browser tab API.
export async function checkCompletedDemoReplay(tab) {
  const replay = tab.playwright.getByRole('button', { name: 'Replay demo', exact: true });
  const pause = tab.playwright.getByRole('button', { name: 'Pause demo', exact: true });
  const caption = tab.playwright.locator('.demo-caption');
  await replay.click();
  await tab.getAXState({ emit: false });
  await until(async () => (await caption.textContent()).startsWith('Preview ready.') && !(await pause.isVisible()), 'The demo must complete its run.', 18000);
  const idleCursor = tab.playwright.getByRole('button', { name: 'Chat with Clank · Idle', exact: true });
  assert.ok(await idleCursor.isVisible(), 'Clank remains on the canvas when playback finishes.');
  await idleCursor.click();
  await tab.getAXState({ emit: false });
  assert.ok(await tab.playwright.getByRole('textbox', { name: 'Message Clank', exact: true }).isVisible(), 'The idle cursor opens Clank chat.');
  await replay.click();
  await tab.getAXState({ emit: false });
  await until(async () => ['Reading the repository', 'Making the changes', 'Starting the preview'].includes(await caption.textContent()), 'Replay must start a fresh clock after the previous run finishes.', 10000);
  return 'Completed replay starts typing and building again.';
}
