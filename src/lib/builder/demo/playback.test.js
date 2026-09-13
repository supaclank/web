import { test, expect } from 'bun:test';
import { DEMO_PHASE } from './model.js';
import { DEMO_PROMPT, PLAYBACK, playbackFrame, nextPlaybackStep } from './playback.js';
import { newDemoSession, submitDemoSession } from './sessions.js';

test('replay types before submitting and clicks only after the preview is ready', () => {
  expect(playbackFrame(0).prompt).toBe('');
  const typing = playbackFrame(PLAYBACK.type + 1000);
  expect(typing.prompt.length).toBeGreaterThan(0);
  expect(typing.prompt.length).toBeLessThan(DEMO_PROMPT.length);
  expect(typing.phase).toBe(DEMO_PHASE.prompt);
  expect(playbackFrame(PLAYBACK.submit).prompt).toBe(DEMO_PROMPT);
  expect(playbackFrame(PLAYBACK.submit).phase).toBe(DEMO_PHASE.reading);
  expect(playbackFrame(PLAYBACK.ready).isPreviewClicked).toBe(false);
  expect(playbackFrame(PLAYBACK.check).phase).toBe(DEMO_PHASE.ready);
  expect(playbackFrame(PLAYBACK.check).isPreviewClicked).toBe(true);
  expect(playbackFrame(PLAYBACK.end).isComplete).toBe(true);
  expect(nextPlaybackStep(PLAYBACK.ready)).toBe(PLAYBACK.ready);
});

test('user sessions keep their prompt and create the same example without a scripted cursor', () => {
  for (const prompt of ['Build a calendar', 'Fix my tests', 'こんにちは']) {
    const draft = newDemoSession('custom', { x: 30, y: 400 });
    const result = submitDemoSession(draft, prompt);
    expect(result.agent.data.prompt).toBe(prompt);
    expect(result.agent.data.isScripted).toBe(false);
    expect(result.nodes.map((node) => node.type)).toEqual(['code', 'preview']);
    expect(result.edges.map((edge) => edge.data.kind)).toEqual(['agent', 'code']);
    expect(result.nodes.every((node) => node.data.sessionId === draft.id)).toBe(true);
    expect(result.nodes[0].position.x).toBeGreaterThan(draft.position.x);
    expect(draft.data.phase).toBe(DEMO_PHASE.prompt);
  }
});

test('empty submissions fail and separate sessions have separate outputs', () => {
  const a = newDemoSession('a', { x: 0, y: 0 });
  const b = newDemoSession('b', { x: 0, y: 300 });
  expect(() => submitDemoSession(a, ' \n ')).toThrow();
  const submitted = submitDemoSession(a, 'hello');
  expect(() => submitDemoSession(submitted.agent, 'again')).toThrow();
  const ids = [...submitted.nodes, ...submitDemoSession(b, 'hello').nodes].map((node) => node.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test('Clank requests get their own canvas row without replacing existing sessions', async () => {
  const { newClankRequest } = await import('./sessions.js');
  const existing = [newDemoSession('draft', { x: 150, y: 400 }), newDemoSession('other', { x: 450, y: 80 })];
  const result = newClankRequest('clank-request', '  Make a reading app  ', existing);
  expect(result.agent.data.prompt).toBe('Make a reading app');
  expect(result.agent.data.isClankRequest).toBe(true);
  expect(result.agent.data.isScripted).toBe(false);
  expect(result.agent.position.x).toBe(150);
  expect(result.agent.position.y).toBeGreaterThan(400);
  expect(result.nodes.every((node) => node.position.y > 400)).toBe(true);
  expect(existing[0].data.prompt).toBe('');
  expect(() => newClankRequest('empty', '  ', existing)).toThrow();
  expect(() => newClankRequest('no-canvas', 'Build an app', [])).toThrow();
  expect(() => newClankRequest('no-session', 'Build an app', [{ type: 'code', position: { x: 0, y: 0 } }])).toThrow();
});
