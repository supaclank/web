import { DEMO_NODE, DEMO_PHASE } from './model.js';

export function deleteDemoNodes(nodes, edges, ids) {
  const removed = new Set(ids);
  const stoppedSessions = nodes.filter(node => removed.has(node.id) && node.type === DEMO_NODE.agent);
  const stoppedWorktrees = new Set(nodes.filter(node => node.type === DEMO_NODE.code && stoppedSessions.some(session => node.data.activeSessionId === session.id || !node.data.activeSessionId && session.data.isScripted && session.data.worktreeId === node.id)).map(node => node.id));
  return {
    nodes: nodes.filter(node => !removed.has(node.id)).map(node => stoppedWorktrees.has(node.data.worktreeId) && node.type !== DEMO_NODE.agent
      ? { ...node, data: { ...node.data, activeSessionId: null, isStopped: node.data.phase !== DEMO_PHASE.ready } } : node),
    edges: edges.filter(edge => !removed.has(edge.source) && !removed.has(edge.target)),
    stoppedSessionIds: stoppedSessions.map(node => node.id),
  };
}
