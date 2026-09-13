<script>
  import { Handle, Position } from '@xyflow/svelte';
  import { DEMO_PHASE } from './model.js';
  import Icon from '../Icon.svelte';
  import { WORK_STAGE } from './progress.js';
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  let { data } = $props();
  let duration = $derived(prefersReducedMotion.current ? 0 : 200);
  let isStarting = $derived(data.phase === DEMO_PHASE.starting && data.step >= WORK_STAGE.preview);
  let isChecking = $derived(data.phase === DEMO_PHASE.starting && data.step === WORK_STAGE.check);
  let checked = $state(['Walk outside', 'Read a chapter']);
  const habits = ['Walk outside', 'Read a chapter', 'Move for 20 minutes', 'Put the phone away'];
  $effect(() => { if (data.isPreviewClicked) checked = ['Walk outside', 'Read a chapter', 'Move for 20 minutes']; });
  $effect(() => { if (data.phase !== DEMO_PHASE.ready) checked = ['Walk outside', 'Read a chapter']; });
</script>
<section class="demo-preview" aria-label="Example web preview">
  <header class="demo-node-handle"><Icon name="web" size={15} /><strong>Web preview</strong><span class:demo-status-ready={data.phase === DEMO_PHASE.ready}>{data.isStopped ? 'Stopped' : data.phase === DEMO_PHASE.ready ? 'Running' : isStarting ? 'Starting' : 'Idle'}</span></header>
  <div class="demo-preview-content">{#if data.phase === DEMO_PHASE.ready}<div class="demo-habits nodrag nopan nowheel" in:fade={{ duration }} out:fade={{ duration }}>
    <div class="demo-app-nav"><strong>daily</strong><span>Today</span></div>
    <h3>Small steps.<br />Every day.</h3><p>{checked.length} of 4 habits complete</p>
    <div class="demo-week" aria-label="This week">{#each ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as day, index}<span class:today={index === 4}>{day}<i class:completed={index < 4}></i></span>{/each}</div>
    <div class="demo-habit-list">{#each habits as habit, index}<label><input type="checkbox" value={habit} data-demo-target={index === 2 ? "preview" : undefined} onchange={() => data.oninteract()} bind:group={checked} /><span>{habit}</span></label>{/each}</div>
  </div>{:else}<div class="demo-preview-waiting" in:fade={{ duration }} out:fade={{ duration }}><Icon name="web" size={25} /><strong>{data.isStopped ? 'Session stopped' : isStarting ? 'Starting your preview…' : isChecking ? 'Checking changes…' : 'Your app will appear here'}</strong><span>{data.isStopped ? 'Connect a new session to continue.' : isStarting ? 'Opening the app' : isChecking ? 'The preview starts after checks pass' : 'A live view of the working copy'}</span>{#if !data.isStopped && isStarting}<span class="demo-loading-track"></span>{/if}</div>{/if}</div>
  <Handle aria-hidden="true" tabindex="-1" type="target" position={Position.Left} isConnectable={false} />
</section>
