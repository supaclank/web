<script>
  import { Handle, Position } from '@xyflow/svelte';
  import Icon from '../Icon.svelte';
  import { DEMO_PORT } from './model.js';
  let { id, data } = $props();
</script>
<section class="demo-repository" aria-label="Example repository">
  <header class="demo-node-handle"><Icon name="github" size={16} /><strong>you / daily</strong></header>
  <p><span class="demo-branch">{data.branch}</span><span>Repository</span></p>
  <Handle class="demo-port" role="button" aria-label="New session from main" title="Drag to the canvas to start from main" tabindex="0" id={DEMO_PORT.repository} type="source" position={Position.Right} onkeydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); data.onbranch(id, DEMO_PORT.repository); } }} style="top: 22px" />
</section>
