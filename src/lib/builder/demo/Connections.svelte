<script>
  import { useSvelteFlow } from '@xyflow/svelte';
  import { DEMO_NODE, DEMO_PORT } from './model.js';
  import { connectionReleasePoint } from './connections.js';
  let { oncreate } = $props();
  const { screenToFlowPosition } = useSvelteFlow();

  export function end(event, state) {
    if (state.isValid || !state.fromNode || state.toNode) return;
    const point = connectionReleasePoint(event);
    if (!document.elementFromPoint(point.x, point.y)?.classList.contains('svelte-flow__pane')) return;
    const source = state.fromNode;
    const handle = state.fromHandle.id;
    const isSource = source.type === DEMO_NODE.repository && handle === DEMO_PORT.repository;
    const isWorktree = source.type === DEMO_NODE.code && [DEMO_PORT.fork, DEMO_PORT.worktree].includes(handle);
    if (!isSource && !isWorktree) return;
    const position = screenToFlowPosition(point, { snapToGrid: false });
    void oncreate(position, source.id, handle);
  }
</script>
