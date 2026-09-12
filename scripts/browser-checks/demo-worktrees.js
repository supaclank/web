import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

async function until(predicate, message) {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) { if (await predicate()) return; await delay(50); }
  assert.fail(message);
}

export async function dragSessionFrom(tab, sourceId, handle) {
  const before = await tab.playwright.locator('.svelte-flow__node-agent').all().then(async (nodes) => Promise.all(nodes.map((node) => node.getAttribute('data-id'))));
  const points = await tab.playwright.evaluate(({ sourceId, handle }) => {
    const canvas = document.querySelector('.demo-flow').getBoundingClientRect();
    const port = document.querySelector(`[data-id="${CSS.escape(sourceId)}"] [data-handleid="${handle}"]`).getBoundingClientRect();
    const from = [port.x + port.width / 2, port.y + port.height / 2];
    for (let y = Math.min(innerHeight, canvas.bottom) - 40; y > Math.max(0, canvas.top) + 30; y -= 50) {
      for (let x = canvas.left + 100; x < canvas.right - 40; x += 90) {
        if (document.elementFromPoint(x, y)?.classList.contains('svelte-flow__pane')) return { from, to: [x, y] };
      }
    }
    return null;
  }, { sourceId, handle });
  assert.ok(points, 'A visible blank drop area is required.');
  const viewport = await tab.playwright.locator('.demo-flow .svelte-flow__viewport').getAttribute('style');
  await tab.drag(points.from, points.to);
  await tab.getAXState({ emit: false });
  const after = await tab.playwright.locator('.svelte-flow__node-agent').all().then(async (nodes) => Promise.all(nodes.map((node) => node.getAttribute('data-id'))));
  const added = after.filter((id) => !before.includes(id));
  assert.equal(added.length, 1, 'A port drag adds exactly one session.');
  await until(() => tab.playwright.evaluate((id) => document.activeElement === document.querySelector(`[data-id="${CSS.escape(id)}"] textarea`), added[0]), 'Dropping a connection focuses the new prompt.');
  assert.equal(await tab.playwright.locator('.demo-flow .svelte-flow__viewport').getAttribute('style'), viewport, 'Creating a session preserves the canvas view.');
  return added[0];
}

export async function connectSessionOutput(tab, sessionId, worktreeId) {
  const points = await tab.playwright.evaluate(({ sessionId, worktreeId }) => {
    const center = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; };
    return { from: center(`[data-id="${CSS.escape(sessionId)}"] [data-handleid="submit"]`), to: center(`[data-id="${CSS.escape(worktreeId)}"] [data-handleid="worktree"]`) };
  }, { sessionId, worktreeId });
  await tab.drag(points.from, points.to);
  await tab.getAXState({ emit: false });
  assert.ok((await tab.playwright.locator(`[data-id="${sessionId}"] .demo-session-context`).textContent()).startsWith('Using '), 'The connection selects the existing worktree.');
  assert.equal(await tab.playwright.locator(`.svelte-flow__edge[data-id="${sessionId}-submit-${worktreeId}"]`).count(), 1, 'The connection has one owned graph edge.');
}

export async function checkClankRequestViewport(tab) {
  const viewport = tab.playwright.locator('.demo-flow .svelte-flow__viewport');
  await tab.playwright.getByRole('textbox', { name: 'Message Clank', exact: true }).fill('Polish the weekly view');
  const before = await viewport.getAttribute('style');
  const sessions = await tab.playwright.locator('.svelte-flow__node-agent').count();
  await tab.playwright.getByRole('button', { name: 'Send to Clank', exact: true }).click();
  await tab.getAXState({ emit: false });
  assert.equal(await tab.playwright.locator('.svelte-flow__node-agent').count(), sessions + 1, 'The sidebar creates a session.');
  assert.equal(await viewport.getAttribute('style'), before, 'Sidebar session creation preserves the canvas view.');
  return 'Sidebar requests create sessions without moving the canvas.';
}
