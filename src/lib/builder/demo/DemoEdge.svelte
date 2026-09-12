<script>
  import { BaseEdge, getBezierPath } from '@xyflow/svelte';
  import { DEMO_NODE, DEMO_PHASE } from './model.js';
  let { id, source, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = $props();
  let path = $derived(getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })[0]);
  let isActive = $derived((data.kind === DEMO_NODE.repository && data.phase === DEMO_PHASE.reading) || (data.kind === DEMO_NODE.agent && data.phase === DEMO_PHASE.editing) || (data.kind === DEMO_NODE.code && data.phase === DEMO_PHASE.starting));
</script>
<BaseEdge {id} {path} style={isActive ? 'stroke: #ededed' : 'stroke: #737373'} />
{#if isActive}<circle class="demo-flow-packet" r="2.5" style={`offset-path: path('${path}')`} />{/if}
