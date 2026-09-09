import { test, expect } from 'bun:test';
import { validateDraft, templateForTarget, applyAgentEvent, visibleMessages, projectNodes, mergeBoardNodes } from './model.js';

test('drafts preserve the idea and reject missing or unknown output targets', () => {
  expect(validateDraft({ prompt: '  A garden planner  ', target: 'web', name: 'Garden' })).toEqual({ prompt: 'A garden planner', target: 'web', name: 'Garden' });
  for (const value of [{ prompt: 'idea', name: 'App' }, { prompt: '', target: 'web', name: 'App' }, { prompt: 'idea', target: 'desktop', name: 'App' }]) {
    expect(() => validateDraft(value)).toThrow();
  }
});

test('output selection uses explicit catalog metadata and never guesses from a title', () => {
  const templates = [{ display_name: 'Web', clone_url: 'https://example.com/unknown.git' }, { build_target: 'mobile', source: 'builtin', clone_url: 'https://example.com/mobile.git' }, { build_target: 'web', source: 'builtin', clone_url: 'https://example.com/web.git' }];
  expect(templateForTarget(templates, 'web').clone_url).toBe('https://example.com/web.git');
  expect(() => templateForTarget(templates.slice(0, 2), 'web')).toThrow('web');
  expect(() => templateForTarget([...templates, templates[2]], 'web')).toThrow();
});

test('streamed text appends deltas and replaces authoritative snapshots without duplication', () => {
  let messages = [];
  const part = (text, is_delta) => ({ type: 'part', data: { message_id: 'm1', part: { id: 'p1', type: 'text', text }, is_delta } });
  messages = applyAgentEvent(messages, part('Hello', true));
  messages = applyAgentEvent(messages, part(' world', true));
  messages = applyAgentEvent(messages, part('Hello world!', false));
  expect(messages[0].parts[0].text).toBe('Hello world!');
  messages = applyAgentEvent(messages, { type: 'message', data: { id: 'm1', role: 'assistant', content: 'Hello world!', parts: [{ id: 'p1', type: 'text', text: 'Hello world!' }] } });
  expect(messages).toHaveLength(1);
});

test('reverted history is hidden and saved nodes can only refer to this account’s sessions', () => {
  expect(visibleMessages([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 'b')).toEqual([{ id: 'a' }]);
  const sessions = [{ id: 'owned', git_ref: { worktree_id: 'worktree' } }];
  expect(projectNodes(sessions, [{ id: 'other', position: { x: 1, y: 2 } }, { id: 'owned', position: { x: 3, y: 4 } }])).toEqual([{ id: 'owned', type: 'project', dragHandle: '.node-handle', position: { x: 3, y: 4 }, data: { session: sessions[0] } }]);
});

test('restoring a board keeps a project created while the restore was in flight', () => {
  const old = { id: 'old' }, created = { id: 'created' }, draft = { id: 'draft' };
  expect(mergeBoardNodes([old], [created, draft])).toEqual([old, created, draft]);
  expect(mergeBoardNodes([old], [{ ...old, position: { x: 5, y: 6 } }])).toEqual([{ ...old, position: { x: 5, y: 6 } }]);
});

test('a history snapshot cannot replay or overwrite text received while it was loading', async () => {
  const { reconcileHistory } = await import('./model.js');
  const snapshot = [{ id: 'old', content: 'Earlier message' }, { id: 'live', parts: [{ id: 'p', text: 'Hello' }] }];
  const streamed = [{ id: 'live', parts: [{ id: 'p', text: 'Hello world' }] }, { id: 'new', content: 'Next' }];
  expect(reconcileHistory(snapshot, streamed, new Set(['live', 'new']))).toEqual([snapshot[0], ...streamed]);
  expect(reconcileHistory(snapshot, streamed, new Set())).toEqual(snapshot);
});

test('damaged board data is rejected independently of server sessions', async () => {
  const { parseBoard } = await import('./model.js');
  expect(() => parseBoard('{')).toThrow();
  expect(() => parseBoard('{"nodes":null}')).toThrow();
  expect(() => parseBoard('{"nodes":[],"viewport":{"x":0,"y":0,"zoom":0}}')).toThrow();
  expect(parseBoard('{"nodes":[],"viewport":{"x":1,"y":2,"zoom":1}}')).toEqual({ nodes: [], viewport: { x: 1, y: 2, zoom: 1 } });
});

test('agent tool carriers attach to their calls and never impersonate the user', async () => {
  const { transcriptMessages } = await import('./model.js');
  const messages = [
    { id: 'user', role: 'user', content: 'Change the headline' },
    { id: 'assistant', role: 'assistant', parts: [{ id: 'call', type: 'tool_call', tool: 'edit', status: 'running' }] },
    { id: 'carrier', role: 'user', content: '', parts: [{ id: 'call', type: 'tool_result', status: 'completed', output: 'File updated' }] }
  ];
  expect(transcriptMessages(messages)).toEqual([
    messages[0], { ...messages[1], parts: [{ ...messages[1].parts[0], status: 'completed', output: 'File updated' }] }
  ]);
  expect(transcriptMessages([messages[2]])[0].role).toBe('tool');
  expect(messages[1].parts[0].status).toBe('running');
});
