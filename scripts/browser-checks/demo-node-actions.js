import assert from 'node:assert/strict';

export async function checkNodeSelection(tab) {
  const node = tab.playwright.locator('.demo-flow .svelte-flow__node[data-id="code"]');
  await node.locator('.demo-node-handle').click();
  await tab.getAXState({ emit: false });
  assert.ok((await node.getAttribute('class')).includes('selected'));
  assert.equal(await tab.playwright.evaluate(() => getComputedStyle(document.querySelector('.svelte-flow__node[data-id="code"]')).outlineStyle), 'none', 'The wrapper does not draw a detached outline.');
  assert.equal(await tab.playwright.evaluate(() => getComputedStyle(document.querySelector('.svelte-flow__node[data-id="code"] .demo-code')).borderTopColor), 'rgb(217, 154, 98)', 'Selection highlights the actual node border in muted orange.');
  await tab.pressKey('BackSpace');
  await tab.getAXState({ emit: false });
  assert.equal(await node.count(), 1, 'Deletion is paused.');
  assert.equal(await tab.playwright.getByRole('dialog').count(), 0);
  return 'Selection stays visible; Backspace does not delete or open confirmation.';
}

export async function checkPromptBackspace(tab, id) {
  const prompt = tab.playwright.locator(`[data-id="${id}"] textarea`);
  await prompt.fill('Keep typing');
  await prompt.press('Backspace');
  await tab.getAXState({ emit: false });
  assert.equal(await prompt.evaluate(element => element.value), 'Keep typin');
  assert.equal(await tab.playwright.getByRole('dialog').count(), 0);
}

export async function checkContextDrag(tab, id) {
  const selector = `[data-id="${id}"] .demo-session-context`;
  const before = await tab.playwright.locator(`.svelte-flow__node[data-id="${id}"]`).getAttribute('style');
  const start = await tab.playwright.locator(selector).evaluate(element => { const r = element.getBoundingClientRect(); return [r.x + 60, r.y + r.height / 2]; });
  await tab.drag(start, [start[0] + 70, start[1] - 35]);
  await tab.getAXState({ emit: false });
  assert.notEqual(await tab.playwright.locator(`.svelte-flow__node[data-id="${id}"]`).getAttribute('style'), before, 'The worktree context label drags its node.');
  return 'Dragging the worktree label moves the session node.';
}
