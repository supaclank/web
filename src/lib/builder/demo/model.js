export const DEMO_PHASE = Object.freeze({ prompt: 0, reading: 1, editing: 2, starting: 3, ready: 4 });
export const DEMO_NODE = Object.freeze({ repository: 'repository', agent: 'agent', code: 'code', preview: 'preview' });
export const DEMO_EDGE = 'flow';
export const DEMO_PORT = Object.freeze({ repository: 'repository', submit: 'submit', worktree: 'worktree', preview: 'preview', fork: 'fork' });
export const WORKTREE_MODE = Object.freeze({ create: 'create', reuse: 'reuse' });
export const DEMO_MAIN_BRANCH = 'main';
export const DEMO_WORK_BRANCH = 'add-habit-tracker';
export const DEMO_OVERVIEW_WIDTH = 1110;
export const DEMO_DURATION = [1000, 1700, 3600, 2200];
export const DEMO_STATUS = ['An idea, ready to go', 'Reading the repository', 'Making the changes', 'Starting the preview', 'Preview ready. Try checking off a habit.'];

export function nextDemoPhase(phase) {
  if (!Object.values(DEMO_PHASE).includes(phase)) throw new Error('Unknown demo phase.');
  return Math.min(phase + 1, DEMO_PHASE.ready);
}

export function demoNodes(phase) {
  return [
    { id: DEMO_NODE.repository, type: DEMO_NODE.repository, position: { x: 0, y: 54 } },
    { id: DEMO_NODE.agent, type: DEMO_NODE.agent, position: { x: 226, y: 34 } },
    { id: DEMO_NODE.code, type: DEMO_NODE.code, position: { x: 600, y: 54 } },
    { id: DEMO_NODE.preview, type: DEMO_NODE.preview, position: { x: 890, y: 0 } },
  ].map((node) => ({ ...node, data: {
    phase, step: 0, title: 'Habit tracker', turns: [], sessionId: DEMO_NODE.agent, prompt: '', isScripted: true,
    branch: node.type === DEMO_NODE.repository ? DEMO_MAIN_BRANCH : DEMO_WORK_BRANCH,
    worktreeId: node.type === DEMO_NODE.repository ? null : DEMO_NODE.code,
    worktreeMode: WORKTREE_MODE.reuse, activeSessionId: null,
  }, dragHandle: '.demo-node-handle' }));
}

export function demoEdges(phase) {
  return [
    { id: 'repository-agent', source: DEMO_NODE.repository, sourceHandle: DEMO_PORT.repository, target: DEMO_NODE.agent, targetHandle: DEMO_PORT.repository },
    { id: 'agent-code', source: DEMO_NODE.agent, sourceHandle: DEMO_PORT.submit, target: DEMO_NODE.code, targetHandle: DEMO_PORT.worktree },
    { id: 'code-preview', source: DEMO_NODE.code, sourceHandle: 'preview', target: DEMO_NODE.preview },
  ].map((edge) => ({ ...edge, type: DEMO_EDGE, data: { phase, sessionId: DEMO_NODE.agent, kind: edge.source }, class: 'demo-edge', selectable: false }));
}

export function demoViewport(width, height, target) {
  if (!(width > 0 && height > 0)) throw new Error('Demo viewport dimensions are required.');
  if (target === DEMO_NODE.preview) return { x: width / 2 - 1030, y: Math.max(24, (height - 310) / 2), zoom: 1 };
  if (target !== DEMO_NODE.agent) throw new Error('Unknown demo focus target.');
  const zoom = width < DEMO_OVERVIEW_WIDTH ? 0.92 : Math.min(1, (width - 56) / 1170);
  return { x: width < DEMO_OVERVIEW_WIDTH ? width / 2 - 386 * zoom : (width - 1170 * zoom) / 2, y: (height - 320 * zoom) / 2, zoom };
}
