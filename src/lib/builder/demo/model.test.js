import { test, expect } from 'bun:test';
import { DEMO_PHASE, DEMO_NODE, DEMO_DURATION, nextDemoPhase, demoNodes, demoEdges, demoViewport } from './model.js';

test('opening a sidebar keeps the canvas composer at a readable scale', () => {
  for (const width of [818, 1024]) {
    const viewport = demoViewport(width, 414, DEMO_NODE.agent);
    expect(viewport.zoom).toBeGreaterThanOrEqual(0.9);
    expect(viewport.x + 386 * viewport.zoom).toBeCloseTo(width / 2);
  }
});

test('the example shows code changes before preview startup and stops when ready', () => {
  let phase = DEMO_PHASE.prompt;
  const seen = [phase];
  while (phase !== DEMO_PHASE.ready) {
    expect(DEMO_DURATION[phase]).toBeGreaterThan(0);
    phase = nextDemoPhase(phase);
    seen.push(phase);
  }
  expect(seen).toEqual([DEMO_PHASE.prompt, DEMO_PHASE.reading, DEMO_PHASE.editing, DEMO_PHASE.starting, DEMO_PHASE.ready]);
  expect(nextDemoPhase(phase)).toBe(DEMO_PHASE.ready);
  expect(() => nextDemoPhase(-1)).toThrow();
});

test('the demo connects repository to header, submit to working copy, and working copy to preview', () => {
  const nodes = demoNodes(DEMO_PHASE.editing);
  const edges = demoEdges(DEMO_PHASE.editing);
  const ids = new Set(nodes.map((node) => node.id));
  for (const edge of edges) { expect(ids.has(edge.source)).toBe(true); expect(ids.has(edge.target)).toBe(true); }
  expect(edges.find((edge) => edge.target === DEMO_NODE.agent).targetHandle).toBe('repository');
  expect(edges.find((edge) => edge.source === DEMO_NODE.agent).sourceHandle).toBe('submit');
  expect(edges.find((edge) => edge.target === DEMO_NODE.preview).source).toBe(DEMO_NODE.code);
  expect(demoNodes(DEMO_PHASE.ready).map((node) => node.position)).toEqual(nodes.map((node) => node.position));
});

test('mobile focus keeps the example readable and can bring its preview into view', () => {
  const width = 356, height = 370;
  expect(demoViewport(width, height, DEMO_NODE.agent).zoom).toBeGreaterThan(0.8);
  const preview = demoViewport(width, height, DEMO_NODE.preview);
  expect(890 * preview.zoom + preview.x).toBeGreaterThanOrEqual(0);
  expect(1170 * preview.zoom + preview.x).toBeLessThanOrEqual(width);
  expect(demoViewport(1130, 414, DEMO_NODE.agent).zoom).toBeGreaterThan(0.9);
  expect(() => demoViewport(0, height, DEMO_NODE.agent)).toThrow();
});
