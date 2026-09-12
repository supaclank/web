import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

async function until(predicate, message, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await delay(100);
  }
  assert.fail(message);
}

export async function checkDemoFollow(tab) {
  await tab.playwright.getByRole('button', { name: 'Replay demo', exact: true }).click();
  await tab.getAXState({ emit: false });
  const caption = tab.playwright.locator('.demo-caption');
  await until(async () => (await caption.textContent()) === 'Reading the repository', 'Replay reaches the submit position.', 8000);
  await tab.playwright.getByRole('button', { name: 'Chat with Clank · Working', exact: true }).click();
  await tab.getAXState({ emit: false });
  assert.ok(await tab.playwright.getByRole('button', { name: 'Pause demo', exact: true }).isVisible(), 'Opening Clank chat must not interrupt playback.');
  const follow = tab.playwright.getByRole('button', { name: 'Stop following Clank', exact: true });
  assert.ok(await follow.isVisible(), 'Clicking the cursor enables follow mode.');
  const isCentered = () => tab.playwright.evaluate(() => {
    const point = document.querySelector('.demo-cursor').getBoundingClientRect();
    const canvas = document.querySelector('.demo-flow').getBoundingClientRect();
    return Math.abs(point.left - canvas.left - canvas.width / 2) < 3 && Math.abs(point.top - canvas.top - canvas.height / 2) < 3;
  });
  await until(isCentered, 'Follow centers the cursor in the remaining canvas.', 2000);
  await until(async () => (await caption.textContent()).startsWith('Preview ready.'), 'Playback continues through preview startup while following.', 10000);
  await until(async () => await tab.playwright.getByRole('button', { name: 'Chat with Clank · Idle', exact: true }).isVisible(), 'The followed run finishes.', 4000);
  assert.ok(await isCentered(), 'Follow tracks the cursor to the preview and stays centered when idle.');
  await follow.click();
  await tab.getAXState({ emit: false });
  assert.equal(await follow.count(), 0, 'Follow mode has an explicit exit.');
  return 'Cursor clicks preserve playback; follow stays centered through completion and can be stopped.';
}

export async function checkFollowPan(tab) {
  const point = await tab.playwright.evaluate(() => {
    const canvas = document.querySelector('.demo-flow').getBoundingClientRect();
    for (let y = Math.max(0, canvas.top) + 50; y < Math.min(innerHeight, canvas.bottom) - 50; y += 50) {
      for (let x = canvas.left + 50; x < canvas.right - 50; x += 50) {
        if (document.elementFromPoint(x, y)?.classList.contains('svelte-flow__pane')) return [x, y];
      }
    }
    return null;
  });
  assert.ok(point, 'A visible blank canvas area is required for the pan check.');
  await tab.drag(point, [point[0] + 35, point[1] + 20]);
  await tab.getAXState({ emit: false });
  assert.equal(await tab.playwright.getByRole('button', { name: 'Stop following Clank', exact: true }).count(), 0, 'Dragging the board releases follow mode.');
  return 'Panning releases follow mode.';
}

export async function checkProfileFollow(tab) {
  const profile = tab.playwright.getByRole('button', { name: 'Follow Clank on canvas', exact: true });
  assert.ok(await profile.isVisible(), 'The @Clank header is an interactive profile.');
  await profile.click();
  await tab.getAXState({ emit: false });
  assert.ok(await tab.playwright.getByRole('button', { name: 'Stop following Clank', exact: true }).isVisible());
  await until(() => tab.playwright.evaluate(() => {
    const cursor = document.querySelector('.demo-cursor').getBoundingClientRect();
    const canvas = document.querySelector('.demo-flow').getBoundingClientRect();
    return Math.abs(cursor.left - canvas.left - canvas.width / 2) < 3 && Math.abs(cursor.top - canvas.top - canvas.height / 2) < 3;
  }), 'Clicking @Clank returns the camera to the cursor.', 2000);
  return '@Clank recenters the cursor and enables follow.';
}
