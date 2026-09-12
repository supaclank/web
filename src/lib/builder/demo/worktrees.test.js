import { test, expect } from 'bun:test';
import { demoNodes, demoEdges, DEMO_NODE, DEMO_PHASE, DEMO_PORT, WORKTREE_MODE } from './model.js';
import { newDemoSession } from './sessions.js';
import { sessionFromPort, connectSession, canConnectSession, runDemoSession, updateSessionPhase } from './worktrees.js';

function graphFromPort(sourceId, port) {
  const nodes = demoNodes(DEMO_PHASE.ready), edges = demoEdges(DEMO_PHASE.ready);
  const result = sessionFromPort('second', { x: 200, y: 440 }, nodes.find((node) => node.id === sourceId), port);
  result.node.data.prompt = 'Make a change';
  return { nodes: [...nodes, result.node], edges: [...edges, result.edge], session: result.node };
}

test('repository drag creates a draft based on main and a separate worktree on submit', () => {
  const graph = graphFromPort(DEMO_NODE.repository, DEMO_PORT.repository);
  expect(graph.session.data.worktreeMode).toBe(WORKTREE_MODE.create);
  expect(graph.session.data.baseBranch).toBe('main');
  expect(graph.nodes.filter((node) => node.type === DEMO_NODE.code)).toHaveLength(1);
  const result = runDemoSession(graph.session, graph.nodes, graph.edges);
  expect(result.nodes.filter((node) => node.type === DEMO_NODE.code)).toHaveLength(2);
  expect(result.nodes.find((node) => node.id === 'second-code').data.parentWorktreeId).toBeNull();
});

test('fork port retains worktree lineage and creates its own preview', () => {
  const graph = graphFromPort(DEMO_NODE.code, DEMO_PORT.fork);
  expect(graph.session.data.parentWorktreeId).toBe(DEMO_NODE.code);
  const result = runDemoSession(graph.session, graph.nodes, graph.edges);
  const child = result.nodes.find((node) => node.id === 'second-code');
  expect(child.data.parentWorktreeId).toBe(DEMO_NODE.code);
  expect(child.data.baseBranch).toBe('add-habit-tracker');
  expect(result.nodes.find((node) => node.id === 'second-preview').data.worktreeId).toBe(child.id);
  expect(result.edges.some((edge) => edge.source === DEMO_NODE.code && edge.sourceHandle === DEMO_PORT.fork && edge.target === 'second')).toBe(true);
});

test('reusing a worktree adds a session without duplicating code or preview nodes', () => {
  const graph = graphFromPort(DEMO_NODE.code, DEMO_PORT.worktree);
  const result = runDemoSession(graph.session, graph.nodes, graph.edges);
  expect(result.nodes.filter((node) => node.type === DEMO_NODE.code)).toHaveLength(1);
  expect(result.nodes.filter((node) => node.type === DEMO_NODE.preview)).toHaveLength(1);
  expect(result.nodes.find((node) => node.id === DEMO_NODE.code).data.activeSessionId).toBe('second');
  expect(result.nodes.find((node) => node.id === DEMO_NODE.agent).data.phase).toBe(DEMO_PHASE.ready);
  const ready = updateSessionPhase(result.nodes, result.edges, 'second', { phase: DEMO_PHASE.ready });
  expect(ready.nodes.find((node) => node.id === DEMO_NODE.code).data.activeSessionId).toBeNull();
  expect(ready.nodes.find((node) => node.id === DEMO_NODE.preview).data.phase).toBe(DEMO_PHASE.ready);
});

test('connecting a fork draft to an existing worktree replaces the fork intent', () => {
  const graph = graphFromPort(DEMO_NODE.code, DEMO_PORT.fork);
  const result = connectSession({ source: 'second', sourceHandle: DEMO_PORT.submit, target: DEMO_NODE.code, targetHandle: DEMO_PORT.worktree }, graph.nodes, graph.edges);
  const session = result.nodes.find((node) => node.id === 'second');
  expect(session.data.worktreeMode).toBe(WORKTREE_MODE.reuse);
  expect(session.data.parentWorktreeId).toBeNull();
  expect(result.edges.filter((edge) => edge.target === 'second')).toHaveLength(0);
  expect(result.edges.filter((edge) => edge.source === 'second')).toHaveLength(1);
});

test('only one session writes a worktree at a time; independent forks can run together', () => {
  const graph = graphFromPort(DEMO_NODE.code, DEMO_PORT.worktree);
  const running = runDemoSession(graph.session, graph.nodes, graph.edges);
  const third = sessionFromPort('third', { x: 0, y: 900 }, running.nodes.find((node) => node.id === DEMO_NODE.code), DEMO_PORT.worktree).node;
  third.data.prompt = 'Another change';
  expect(() => runDemoSession(third, [...running.nodes, third], running.edges)).toThrow('Another session');
  const fork = graphFromPort(DEMO_NODE.code, DEMO_PORT.fork);
  expect(() => runDemoSession(fork.session, [...running.nodes.filter((node) => node.id !== 'second'), fork.session], running.edges)).toThrow('finish before forking');
  const other = newDemoSession('independent', { x: 0, y: 1000 });
  other.data.prompt = 'Build something else';
  expect(runDemoSession(other, [...running.nodes, other], running.edges).nodes.some((node) => node.id === 'independent-code')).toBe(true);
});

test('running sessions and preview ports cannot be rewired into other worktrees', () => {
  const graph = graphFromPort(DEMO_NODE.repository, DEMO_PORT.repository);
  expect(canConnectSession({ source: DEMO_NODE.code, sourceHandle: DEMO_PORT.preview, target: 'second', targetHandle: DEMO_PORT.repository }, graph.nodes)).toBe(false);
  const running = runDemoSession(graph.session, graph.nodes, graph.edges);
  expect(canConnectSession({ source: 'second', sourceHandle: DEMO_PORT.submit, target: DEMO_NODE.code, targetHandle: DEMO_PORT.worktree }, running.nodes)).toBe(false);
  expect(() => connectSession({ source: 'missing', target: 'second' }, graph.nodes, graph.edges)).toThrow();
});
