import { DEMO_NODE, DEMO_PORT, DEMO_PHASE, DEMO_EDGE, WORKTREE_MODE } from './model.js';
import { newDemoSession, submitDemoSession } from './sessions.js';

function connectionEdge(connection, session, kind) {
  return { ...connection, id: `${connection.source}-${connection.sourceHandle}-${connection.target}`, type: DEMO_EDGE, class: 'demo-edge', selectable: false, data: { sessionId: session.id, phase: session.data.phase, kind } };
}

export function canConnectSession(connection, nodes) {
  const source = nodes.find((node) => node.id === connection.source);
  const target = nodes.find((node) => node.id === connection.target);
  if (!source || !target) return false;
  const isDraft = (node) => node.type === DEMO_NODE.agent && node.data.phase === DEMO_PHASE.prompt && !node.data.isScripted;
  if (isDraft(source) && connection.sourceHandle === DEMO_PORT.submit) return target.type === DEMO_NODE.code && connection.targetHandle === DEMO_PORT.worktree;
  if (!isDraft(target) || connection.targetHandle !== DEMO_PORT.repository) return false;
  return source.type === DEMO_NODE.repository && connection.sourceHandle === DEMO_PORT.repository || source.type === DEMO_NODE.code && connection.sourceHandle === DEMO_PORT.fork;
}

export function connectSession(connection, nodes, edges) {
  if (!canConnectSession(connection, nodes)) throw new Error('Connect a repository or fork to a new session, or its output to a worktree.');
  const source = nodes.find((node) => node.id === connection.source);
  const target = nodes.find((node) => node.id === connection.target);
  const isReuse = source.type === DEMO_NODE.agent;
  const session = isReuse ? source : target;
  const origin = isReuse ? target : source;
  if (!origin.data.branch) throw new Error('The worktree source must have a branch.');
  const data = isReuse
    ? { worktreeMode: WORKTREE_MODE.reuse, worktreeId: target.id, branch: target.data.branch, baseNodeId: null, baseBranch: null, parentWorktreeId: null }
    : { worktreeMode: WORKTREE_MODE.create, worktreeId: null, branch: null, baseNodeId: source.id, baseBranch: source.data.branch, parentWorktreeId: source.type === DEMO_NODE.code ? source.id : null };
  return {
    nodes: nodes.map((node) => node.id === session.id ? { ...node, data: { ...node.data, ...data } } : node),
    edges: [...edges.filter((edge) => edge.source !== session.id && edge.target !== session.id), connectionEdge(connection, session, source.type)],
  };
}

export function sessionFromPort(id, position, source, handle) {
  const session = newDemoSession(id, position);
  const isReuse = source.type === DEMO_NODE.code && handle === DEMO_PORT.worktree;
  const connection = isReuse
    ? { source: id, sourceHandle: DEMO_PORT.submit, target: source.id, targetHandle: DEMO_PORT.worktree }
    : { source: source.id, sourceHandle: handle, target: id, targetHandle: DEMO_PORT.repository };
  const graph = connectSession(connection, [source, session], []);
  return { node: graph.nodes.find((node) => node.id === id), edge: graph.edges[0] };
}

export function runDemoSession(session, nodes, edges) {
  if (!session.data.prompt.trim()) throw new Error('Write a prompt first.');
  if (session.data.phase !== DEMO_PHASE.prompt) throw new Error('This demo session has already started.');
  if (session.data.worktreeMode === WORKTREE_MODE.create) {
    const source = nodes.find((node) => node.id === session.data.baseNodeId);
    if (!source) throw new Error('The source for this worktree is no longer on the canvas.');
    if (source.type === DEMO_NODE.code && source.data.activeSessionId) throw new Error('Wait for this worktree to finish before forking it.');
    const result = submitDemoSession(session, session.data.prompt);
    return { nodes: [...nodes.map((node) => node.id === session.id ? result.agent : node), ...result.nodes], edges: [...edges, ...result.edges] };
  }
  if (session.data.worktreeMode !== WORKTREE_MODE.reuse) throw new Error('Choose how this session uses a worktree.');
  const worktree = nodes.find((node) => node.type === DEMO_NODE.code && node.id === session.data.worktreeId);
  if (!worktree) throw new Error('Connect this session to a worktree.');
  if (worktree.data.activeSessionId) throw new Error('Another session is editing this worktree. Wait for it to finish.');
  return updateSessionPhase(nodes, edges, session.id, { phase: DEMO_PHASE.reading, step: 0, prompt: session.data.prompt.trim(), isScripted: false, activeSessionId: session.id });
}

export function updateSessionPhase(nodes, edges, id, data) {
  const session = nodes.find((node) => node.id === id && node.type === DEMO_NODE.agent);
  if (!session) throw new Error('The session is no longer on this canvas.');
  const worktreeId = session.data.worktreeId;
  const worktreeData = { phase: data.phase, isStopped: false };
  if ('step' in data) worktreeData.step = data.step;
  if ('hasStarted' in data) worktreeData.hasStarted = data.hasStarted;
  if ('isPreviewClicked' in data) worktreeData.isPreviewClicked = data.isPreviewClicked;
  if ('activeSessionId' in data) worktreeData.activeSessionId = data.activeSessionId;
  if (data.phase === DEMO_PHASE.ready) worktreeData.activeSessionId = null;
  return {
    nodes: nodes.map((node) => {
      if (node.id === id) return { ...node, data: { ...node.data, ...data } };
      if (node.type !== DEMO_NODE.agent && node.data.worktreeId === worktreeId && worktreeId) return { ...node, data: { ...node.data, ...worktreeData } };
      return node;
    }),
    edges: edges.map((edge) => edge.data.sessionId === id || edge.source === worktreeId && edge.sourceHandle === DEMO_PORT.preview ? { ...edge, data: { ...edge.data, phase: data.phase } } : edge),
  };
}
