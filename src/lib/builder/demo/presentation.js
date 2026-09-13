import { DEMO_NODE, DEMO_PHASE } from './model.js';
import { WORK_STAGE } from './progress.js';

export function presentDemoGraph(nodes, edges) {
  const presented = nodes.map(node => {
    if (node.type === DEMO_NODE.code) return { ...node, hidden: node.data.phase === DEMO_PHASE.prompt };
    if (node.type !== DEMO_NODE.preview) return node;
    const hasStarted = node.data.hasStarted === true || node.data.phase === DEMO_PHASE.ready ||
      node.data.phase === DEMO_PHASE.starting && node.data.step >= WORK_STAGE.preview;
    return { ...node, hidden: !hasStarted, data: { ...node.data, hasStarted } };
  });
  const hidden = new Set(presented.filter(node => node.hidden).map(node => node.id));
  return { nodes: presented, edges: edges.map(edge => ({ ...edge, hidden: hidden.has(edge.source) || hidden.has(edge.target) })) };
}
