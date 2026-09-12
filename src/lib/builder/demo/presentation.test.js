import { test, expect } from 'bun:test';
import { demoNodes, demoEdges, DEMO_PHASE } from './model.js';
import { WORK_STAGE } from './progress.js';
import { presentDemoGraph } from './presentation.js';

test('worktree and preview appear only at their lifecycle stages', () => {
  const stage = (phase, step) => presentDemoGraph(demoNodes(phase).map(node => ({ ...node, data: { ...node.data, step } })), demoEdges(phase));
  const draft = stage(DEMO_PHASE.prompt, WORK_STAGE.read);
  expect(draft.nodes.find(node => node.id === 'code').hidden).toBe(true);
  expect(draft.nodes.find(node => node.id === 'preview').hidden).toBe(true);
  expect(draft.edges.filter(edge => !edge.hidden).map(edge => edge.id)).toEqual(['repository-agent']);
  expect(stage(DEMO_PHASE.reading, WORK_STAGE.read).nodes.find(node => node.id === 'code').hidden).toBe(false);
  expect(stage(DEMO_PHASE.starting, WORK_STAGE.check).nodes.find(node => node.id === 'preview').hidden).toBe(true);
  const started = stage(DEMO_PHASE.starting, WORK_STAGE.preview);
  expect(started.nodes.find(node => node.id === 'preview').hidden).toBe(false);
  const editingAgain = presentDemoGraph(started.nodes.map(node => ({ ...node, data: { ...node.data, phase: DEMO_PHASE.reading, step: WORK_STAGE.read } })), started.edges);
  expect(editingAgain.nodes.find(node => node.id === 'preview').hidden).toBe(false);
});
