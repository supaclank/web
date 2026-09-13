import { test, expect } from 'bun:test';
import { demoNodes, demoEdges, DEMO_PHASE, DEMO_NODE } from './model.js';
import { deleteDemoNodes } from './deletion.js';

test('deleting a node removes its connections and keeps neighboring nodes in place', () => {
  const nodes = demoNodes(DEMO_PHASE.ready), edges = demoEdges(DEMO_PHASE.ready);
  const result = deleteDemoNodes(nodes, edges, [DEMO_NODE.code]);
  expect(result.nodes.map(node => node.id)).toEqual(['repository', 'agent', 'preview']);
  expect(result.edges.map(edge => edge.id)).toEqual(['repository-agent']);
  expect(result.nodes.map(node => node.position)).toEqual(nodes.filter(node => node.id !== DEMO_NODE.code).map(node => node.position));
});

test('deleting an active session releases its worktree and stops unfinished previews', () => {
  const nodes = demoNodes(DEMO_PHASE.starting).map(node => node.id === DEMO_NODE.code ? { ...node, data: { ...node.data, activeSessionId: DEMO_NODE.agent } } : node);
  const result = deleteDemoNodes(nodes, demoEdges(DEMO_PHASE.starting), [DEMO_NODE.agent]);
  expect(result.nodes.find(node => node.id === DEMO_NODE.code).data.activeSessionId).toBeNull();
  expect(result.nodes.find(node => node.id === DEMO_NODE.preview).data.isStopped).toBe(true);
  expect(result.stoppedSessionIds).toEqual([DEMO_NODE.agent]);
});

test('deleting a draft does not stop another session using its worktree', () => {
  const nodes = demoNodes(DEMO_PHASE.starting).map(node => ({ ...node, data: { ...node.data, activeSessionId: DEMO_NODE.agent } }));
  const draft = { ...nodes[1], id: 'draft', data: { ...nodes[1].data, phase: DEMO_PHASE.prompt } };
  const result = deleteDemoNodes([...nodes, draft], demoEdges(DEMO_PHASE.starting), ['draft']);
  expect(result.nodes.find(node => node.id === DEMO_NODE.code).data.activeSessionId).toBe(DEMO_NODE.agent);
  expect(result.nodes.find(node => node.id === DEMO_NODE.preview).data.isStopped).not.toBe(true);
});

test('restarting a worktree clears stopped output states', async () => {
  const { updateSessionPhase } = await import('./worktrees.js');
  const nodes = demoNodes(DEMO_PHASE.starting).map(node => ({ ...node, data: { ...node.data, isStopped: true } }));
  const result = updateSessionPhase(nodes, demoEdges(DEMO_PHASE.starting), DEMO_NODE.agent, { phase: DEMO_PHASE.reading });
  expect(result.nodes.find(node => node.id === DEMO_NODE.code).data.isStopped).toBe(false);
  expect(result.nodes.find(node => node.id === DEMO_NODE.preview).data.isStopped).toBe(false);
});
