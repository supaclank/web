import { sessionTitle } from './progress.js';
import { DEMO_PHASE, DEMO_NODE, DEMO_EDGE, DEMO_PORT, WORKTREE_MODE, DEMO_MAIN_BRANCH } from './model.js';

export function newDemoSession(id, position) {
  return { id, type: DEMO_NODE.agent, position, dragHandle: '.demo-node-handle', data: { sessionId: id, step: 0, title: 'New session', turns: [], phase: DEMO_PHASE.prompt, prompt: '', isScripted: false, worktreeMode: WORKTREE_MODE.create, baseNodeId: DEMO_NODE.repository, baseBranch: DEMO_MAIN_BRANCH, parentWorktreeId: null, worktreeId: null } };
}

export function submitDemoSession(node, prompt) {
  if (!prompt.trim()) throw new Error('A demo prompt is required.');
  if (node.data.phase !== DEMO_PHASE.prompt) throw new Error('This demo session has already started.');
  const codeId = `${node.id}-code`, previewId = `${node.id}-preview`;
  const data = { sessionId: node.id, step: 0, phase: DEMO_PHASE.reading, isScripted: false, worktreeId: codeId };
  const branch = `work/${node.id.slice(0, 8)}`;
  return {
    agent: { ...node, data: { ...node.data, ...data, branch, title: sessionTitle(prompt), prompt: prompt.trim() } },
    nodes: [
      { id: codeId, type: DEMO_NODE.code, position: { x: node.position.x + 374, y: node.position.y + 20 } },
      { id: previewId, type: DEMO_NODE.preview, position: { x: node.position.x + 664, y: node.position.y - 34 } },
    ].map((output) => ({ ...output, data: { ...data, branch, baseBranch: node.data.baseBranch, parentWorktreeId: node.data.parentWorktreeId, activeSessionId: node.id }, dragHandle: '.demo-node-handle' })),
    edges: [
      { id: `${node.id}-code-edge`, source: node.id, sourceHandle: DEMO_PORT.submit, target: codeId, targetHandle: DEMO_PORT.worktree, kind: DEMO_NODE.agent },
      { id: `${node.id}-preview-edge`, source: codeId, sourceHandle: 'preview', target: previewId, kind: DEMO_NODE.code },
    ].map(({ kind, ...edge }) => ({ ...edge, type: DEMO_EDGE, data: { ...data, kind }, class: 'demo-edge', selectable: false })),
  };
}

const CLANK_SESSION_ROW_GAP = 400;

export function newClankRequest(id, prompt, nodes) {
  const sessions = nodes.filter((node) => node.type === DEMO_NODE.agent);
  if (!sessions.length) throw new Error('A demo canvas with a session is required.');
  const position = { x: Math.min(...sessions.map((node) => node.position.x)), y: Math.max(...nodes.map((node) => node.position.y)) + CLANK_SESSION_ROW_GAP };
  const result = submitDemoSession(newDemoSession(id, position), prompt);
  return { ...result, agent: { ...result.agent, data: { ...result.agent.data, isClankRequest: true } } };
}
