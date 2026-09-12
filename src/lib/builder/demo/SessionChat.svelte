<script>
  import { tick, untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import { DEMO_PHASE } from './model.js';
  import { WORK_STEPS, LAST_WORK_STEP, workStep } from './progress.js';
  import Icon from '../Icon.svelte';
  let { session, onback, onclose, oncontinue } = $props();
  let prompt = $state('');
  let error = $state('');
  let transcript;
  let isAtBottom = true;
  let data = $derived(session.data);
  let currentStep = $derived(data.phase === DEMO_PHASE.ready ? LAST_WORK_STEP : data.step);
  let isWorking = $derived(data.phase !== DEMO_PHASE.ready);
  let duration = $derived(prefersReducedMotion.current ? 0 : 160);
  $effect(() => {
    const current = `${session.id}:${data.step}:${data.phase}`;
    untrack(() => { if (current && isAtBottom) void tick().then(() => { if (transcript) transcript.scrollTop = transcript.scrollHeight; }); });
  });
  async function send(event) {
    event.preventDefault();
    if (!prompt.trim() || isWorking) return;
    try { oncontinue(session.id, prompt); prompt = ''; error = ''; }
    catch (cause) { error = cause.message; }
  }
</script>
<header class="session-chat-header">
  <button type="button" aria-label="Back to Clank" onclick={onback}><span class="session-back"><Icon name="right" size={14} /></span></button>
  <strong title={data.title}>{data.title}</strong>
  <span class="assistant-status" class:is-working={isWorking}><i aria-hidden="true"></i>{isWorking ? 'Working' : 'Done'}</span>
  <button type="button" class="assistant-close" aria-label="Close session chat" onclick={onclose}><Icon name="close" size={16} /></button>
</header>
<div class="assistant-transcript session-transcript" role="log" aria-label={`Conversation: ${data.title}`} bind:this={transcript} onscroll={() => isAtBottom = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 40}>
  {#each data.turns as turn, index (index)}
    <div class="assistant-message assistant-user"><p class="assistant-request" data-umami-mask>{turn.prompt}</p></div>
    <p class="assistant-message">{workStep(turn.step).text}</p>
  {/each}
  <div class="assistant-message assistant-user"><p class="assistant-request" data-umami-mask>{data.prompt}</p></div>
  {#each WORK_STEPS.slice(0, currentStep + 1) as activity, index (index)}
    <div class="session-chat-event" in:fly={{ y: 6, duration }}>
      <p>{activity.text}</p>
      <span class="session-chat-action" class:is-current={index === currentStep && isWorking}>{activity.action}</span>
    </div>
  {/each}
</div>
<form onsubmit={send}>
  <div class="assistant-composer"><textarea aria-label="Message session" placeholder={isWorking ? 'Agent is working…' : 'Ask for a change…'} rows="2" bind:value={prompt} disabled={isWorking} onkeydown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) void send(event); }} data-umami-mask></textarea><div class="assistant-compose-footer"><span>This session</span><button type="submit" class="assistant-send" aria-label="Send to session" disabled={isWorking || !prompt.trim()}><Icon name="arrow" size={16} /></button></div></div>
  {#if error}<p class="assistant-error" role="alert">{error}</p>{/if}
  <p class="assistant-disclosure">Demo · Scripted actions and changes.</p>
</form>
<style>
  .session-chat-header { gap: 5px; }
  .session-chat-header strong { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 12px; font-weight: 500; }
  .session-back { display: flex; transform: rotate(180deg); }
  .session-chat-event { margin-bottom: 17px; font-size: 13px; line-height: 1.5; }
  .session-chat-event p { margin: 0 0 5px; }
  .session-chat-action { font-size: 11px; color: #afafaf; }
  .session-chat-action.is-current { color: var(--demo-added); }
</style>
