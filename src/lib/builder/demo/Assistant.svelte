<script>
  import { tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import SessionChat from './SessionChat.svelte';
  import { DEMO_NODE, DEMO_PHASE, DEMO_STATUS } from './model.js';
  import Icon from '../Icon.svelte';
  import './assistant.css';
  let { requests, sessions, isReady, isWorking, onopen, onrequest, onshow, oncontinue } = $props();
  const panelId = $props.id();
  let isOpen = $state(false);
  let sessionId = $state(null);
  let selectedSession = $derived(sessions.find(session => session.id === sessionId));
  let duration = $derived(prefersReducedMotion.current ? 0 : 180);
  export function openSession(id) {
    if (!sessions.some(session => session.id === id)) throw new Error('Session is no longer on the canvas.');
    sessionId = id; isOpen = true;
  }
  async function backToClank() { sessionId = null; await tick(); input.focus({ preventScroll: true }); }
  let isSending = $state(false);
  let prompt = $state('');
  let error = $state('');
  let launcher;
  let input = $state(null);
  let transcript = $state(null);
  let status = $derived(isWorking ? 'Working' : 'Idle');

  async function toggle() {
    if (isOpen) { close(); return; }
    await open();
  }
  export async function open() {
    sessionId = null; onopen(); isOpen = true;
    await tick();
    input.focus({ preventScroll: true });
    transcript.scrollTop = transcript.scrollHeight;
  }
  async function close() { isOpen = false; await tick(); launcher.focus({ preventScroll: true }); }
  function keydown(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
  }
  function promptKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); void send(); }
  }
  async function send() {
    if (!prompt.trim() || isSending) return;
    isSending = true; error = '';
    try {
      const sentPrompt = prompt;
      await onrequest(sentPrompt);
      if (prompt === sentPrompt) prompt = '';
      await tick();
      if (isOpen) { transcript.scrollTop = transcript.scrollHeight; input.focus({ preventScroll: true }); }
    } catch { error = 'The example couldn’t start. Try sending again.'; }
    finally { isSending = false; }
  }
  function show(id, target) { onshow(id, target); }
</script>
<svelte:window onkeydown={(event) => { if (isOpen) keydown(event); }} />
<div class="demo-assistant nodrag nopan nowheel" class:is-open={isOpen}>
  {#if isOpen}
    <section class="assistant-panel" id={panelId} aria-label={selectedSession ? `Session chat: ${selectedSession.data.title}` : "Chat with Clank"} in:fade={{ duration }}>
      {#if selectedSession}{#key selectedSession.id}<SessionChat session={selectedSession} onback={backToClank} onclose={close} {oncontinue} />{/key}{:else}
      <header><button type="button" class="assistant-mention" aria-label="Follow Clank on canvas" title="Find Clank on the canvas" onclick={onopen}>@Clank</button><span class="assistant-status" class:is-working={isWorking}><i aria-hidden="true"></i>{status}</span><button type="button" class="assistant-close" aria-label="Close Clank chat" onclick={close}><Icon name="close" size={16} /></button></header>
      <div class="assistant-transcript" role="log" aria-label="Clank conversation" bind:this={transcript}>
        {#if !requests.length}<p class="assistant-welcome">What should we work on?</p><p class="assistant-intro">Tell me what you have in mind. We’ll take it from there.</p>
        {:else}{#each requests as request (request.id)}
          <div class="assistant-message assistant-user" aria-label="Your message"><p class="assistant-request" data-umami-mask>{request.prompt}</p></div>
          <div class="assistant-response assistant-message"><span class="assistant-speaker">clank</span><p>{request.phase === DEMO_PHASE.ready ? 'Your preview is ready. Take a look.' : 'I’ve started a session on your canvas.'}</p><span class="assistant-activity">{DEMO_STATUS[request.phase]}</span><div>
            <button type="button" class="assistant-follow" onclick={() => show(request.id, DEMO_NODE.agent)}>Show session<Icon name="right" size={13} /></button>
            {#if request.phase === DEMO_PHASE.ready}<button type="button" class="assistant-follow" onclick={() => show(request.id, DEMO_NODE.preview)}>View preview<Icon name="external" size={12} /></button>{/if}
          </div></div>
        {/each}{/if}
      </div>
      <form onsubmit={(event) => { event.preventDefault(); void send(); }}>
        <div class="assistant-composer"><textarea bind:this={input} bind:value={prompt} aria-label="Message Clank" placeholder="Ask anything…" rows="2" onkeydown={promptKeydown} data-umami-mask></textarea><div class="assistant-compose-footer"><span>On this canvas</span><button type="submit" class="assistant-send" aria-label="Send to Clank" disabled={!prompt.trim() || isSending}><Icon name="arrow" size={16} /></button></div></div>
        {#if error}<p class="assistant-error" role="alert">{error}</p>{/if}
        <p class="assistant-disclosure">Demo · Every request runs the habit tracker.</p>
      </form>
      {/if}
    </section>
  {/if}
  <button type="button" class="assistant-launch" class:is-open={isOpen} bind:this={launcher} onclick={toggle} aria-label="Chat with Clank" aria-expanded={isOpen} aria-controls={panelId} disabled={!isReady}>
    <img src="/mascot.png" alt="" width="28" height="28" />
  </button>
</div>
