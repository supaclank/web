<script>
  import { Handle, Position } from '@xyflow/svelte';
  import { DEMO_PHASE, DEMO_PORT } from './model.js';
  import Icon from '../Icon.svelte';
  import { fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { prefersReducedMotion } from 'svelte/motion';
  import { workStep, LAST_WORK_STEP } from './progress.js';
  import DiffStat from './DiffStat.svelte';
  let { id, data } = $props();
  let activity = $derived(workStep(data.phase === DEMO_PHASE.ready ? LAST_WORK_STEP : data.step));
  function keydown(event, port) { if (event.key === 'Enter') { event.preventDefault(); data.onbranch(id, port); } }
</script>
<section class="demo-code" aria-label="Example working copy">
  <header class="demo-node-handle"><Icon name="note" size={15} /><strong>daily</strong><span>Code</span></header>
  <div class="demo-code-branch">{data.branch}</div>
  {#if data.parentWorktreeId}<div class="demo-code-base">from {data.baseBranch}</div>{/if}
  <div class="demo-changes" style:height={`${30 + Math.max(1, data.phase < DEMO_PHASE.editing ? 0 : activity.files.length) * 24}px`}>
    {#if data.phase < DEMO_PHASE.editing}<p>Waiting for changes</p>
    {:else}{#each activity.files as file (file.name)}<div animate:flip={{ duration: prefersReducedMotion.current ? 0 : 200 }} in:fly={{ y: 6, duration: prefersReducedMotion.current ? 0 : 200 }}><span>{file.name}</span><DiffStat added={file.added} removed={file.removed} /></div>{/each}{/if}
  </div>
  <footer><span>{data.isStopped ? 'Stopped' : data.activeSessionId ? 'Editing' : data.phase < DEMO_PHASE.editing ? 'Working copy' : `${activity.files.length} ${activity.files.length === 1 ? 'file' : 'files'} changed`}</span><span>{data.phase >= DEMO_PHASE.starting ? 'Preview' : 'Diff'}{#if data.phase >= DEMO_PHASE.starting}<Icon name="right" size={12} />{/if}</span></footer>
  <Handle class="demo-port" role="button" aria-label="Use this worktree in a new session" title="Connect a session here to use this worktree" tabindex="0" type="target" id={DEMO_PORT.worktree} position={Position.Left} onkeydown={(event) => keydown(event, DEMO_PORT.worktree)} style="top: calc(100% - 21px)" />
  <Handle class="demo-port demo-fork-port" role="button" aria-label="Fork this worktree" title="Drag to create a session in a new worktree" tabindex="0" type="source" id={DEMO_PORT.fork} position={Position.Bottom} onkeydown={(event) => keydown(event, DEMO_PORT.fork)}><span>Fork</span></Handle>
  <Handle aria-hidden="true" tabindex="-1" type="source" id="preview" position={Position.Right} isConnectable={false} style="top: calc(100% - 21px)" />
</section>
