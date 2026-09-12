import assert from 'node:assert/strict';

export async function checkDemoSidebar(tab) {
  await tab.playwright.getByRole('button', { name: 'Chat with Clank', exact: true }).click();
  await tab.getAXState({ emit: false });
  const layout = await tab.playwright.evaluate(() => {
    const panel = document.querySelector('.assistant-panel');
    const canvas = document.querySelector('.demo-flow');
    const a = panel.getBoundingClientRect(), b = canvas.getBoundingClientRect();
    return {
      isSeparate: a.left >= b.right - 1 || a.top >= b.bottom - 1,
      avatars: panel.querySelectorAll('img').length,
      isFocused: document.activeElement === panel.querySelector('textarea'),
    };
  });
  assert.ok(layout.isSeparate, 'Clank chat must reserve space outside the canvas.');
  assert.equal(layout.avatars, 0, 'Conversation uses text labels without avatars.');
  assert.ok(layout.isFocused, 'Opening chat focuses its composer.');
  const input = tab.playwright.getByRole('textbox', { name: 'Message Clank', exact: true });
  const prompt = 'Add a small weekly progress summary.';
  await input.fill(prompt);
  await input.press('Enter');
  await tab.getAXState({ emit: false });
  assert.ok((await tab.playwright.locator('.assistant-transcript').textContent()).includes(prompt));
  const userMessage = await tab.playwright.evaluate(() => {
    const message = document.querySelector('.assistant-user');
    return { hasLabel: message.querySelector('.assistant-speaker') !== null, alignment: getComputedStyle(message).textAlign };
  });
  assert.equal(userMessage.hasLabel, false, 'User messages omit the redundant speaker label.');
  assert.equal(userMessage.alignment, 'right', 'User messages align to the right.');
  assert.ok(await tab.playwright.evaluate(() => document.activeElement === document.querySelector('.assistant-panel textarea')), 'Sending returns focus to the composer.');
  assert.ok(await input.isVisible(), 'Sending keeps the sidebar open.');
  await input.press('Escape');
  await tab.getAXState({ emit: false });
  assert.equal(await tab.playwright.locator('.assistant-panel').count(), 0);
  await tab.playwright.getByRole('button', { name: 'Chat with Clank', exact: true }).click();
  await tab.getAXState({ emit: false });
  assert.ok((await tab.playwright.locator('.assistant-transcript').textContent()).includes(prompt), 'History survives closing.');
  await tab.playwright.getByRole('button', { name: 'Show session', exact: true }).last().click();
  await tab.getAXState({ emit: false });
  assert.ok(await input.isVisible(), 'Following a session keeps the sidebar available.');
  return 'Sidebar reserves board space, focuses input, accepts requests and retains history.';
}
