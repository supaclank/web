<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import { Handle, Position } from '@xyflow/svelte';
  import { DEMO_PHASE, DEMO_PORT, WORKTREE_MODE } from './model.js';
  import Icon from '../Icon.svelte';
  import SessionSummary from './SessionSummary.svelte';
  let { id, data } = $props();
  let content;
  let height = $state(null);
  onMount(() => {
    const observer = new ResizeObserver(([entry]) => height = entry.contentRect.height + 2);
    observer.observe(content);
    return () => observer.disconnect();
  });
  function submit(event) { event.preventDefault(); if (data.prompt.trim() && data.phase === DEMO_PHASE.prompt) data.onsubmit(id); }
  function keydown(event) { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) submit(event); }
</script>
<section class="demo-agent" aria-label={data.isScripted ? 'Example agent conversation' : 'Your demo session'}>
  <header class="demo-node-handle"><Icon name="grip" size={13} /><span title={data.title} class:session-title={data.phase !== DEMO_PHASE.prompt}>{data.phase === DEMO_PHASE.prompt ? data.isScripted ? 'Import repository' : 'New session' : data.title}</span></header>
  <div class="demo-agent-body" style:height={height === null ? undefined : `${height}px`}><div bind:this={content}>
    {#if !data.isScripted}<p class="demo-session-context demo-node-handle">{data.worktreeMode === WORKTREE_MODE.reuse ? `Using ${data.branch}` : `New worktree from ${data.baseBranch}`}</p>{/if}
    {#if data.phase === DEMO_PHASE.prompt}
      <form class="demo-draft-form nodrag nopan" in:fade={{ duration: prefersReducedMotion.current ? 0 : 180 }} onsubmit={submit}>
        <textarea class="demo-prompt nowheel" data-demo-target="prompt" data-umami-mask aria-label="Demo prompt" placeholder="What would you like to build?" rows="3" value={data.prompt} onfocus={() => data.onedit(id, data.prompt)} oninput={(event) => data.onedit(id, event.currentTarget.value)} onkeydown={keydown}></textarea>
        <div class="demo-agent-reply"><span>Any prompt runs the habit-tracker example.</span></div>
        <div class="demo-agent-footer"><span><Icon name="plus" size={16} /><Icon name="cloud" size={15} />Cloud</span><button type="submit" class="demo-submit" data-demo-target="submit" aria-label="Run demo" disabled={!data.prompt.trim()}><Icon name="arrow" size={16} /></button></div>
      </form>
    {:else}
      <SessionSummary {data} />
      <div class="session-node-footer demo-node-handle"><span>{data.phase === DEMO_PHASE.ready ? 'Completed' : 'Working'}</span><button type="button" class="nodrag nopan" data-demo-target="submit" aria-label="Open session chat" onclick={() => data.onopen(id)}>Open chat<Icon name="right" size={13} /></button></div>
    {/if}
  </div></div>
  <Handle aria-label="Session source" tabindex="-1" type="target" id={DEMO_PORT.repository} position={Position.Left} isConnectable={!data.isScripted && data.phase === DEMO_PHASE.prompt} style="top: 15px" />
  <Handle class={!data.isScripted && data.phase === DEMO_PHASE.prompt ? 'demo-port' : ''} aria-label="Connect session to a worktree" title="Drag to a code node to use its worktree" tabindex="-1" type="source" id={DEMO_PORT.submit} position={Position.Right} isConnectable={!data.isScripted && data.phase === DEMO_PHASE.prompt} style="top: calc(100% - 27px)" />
</section>
