<script>
  import { fade, fly } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import { workStep, LAST_WORK_STEP } from './progress.js';
  import { SESSION_VIEW } from './session-views.js';
  import { DEMO_PHASE } from './model.js';
  let { data } = $props();
  let activity = $derived(workStep(data.phase === DEMO_PHASE.ready ? LAST_WORK_STEP : data.step));
  let duration = $derived(prefersReducedMotion.current ? 0 : 180);
</script>
<div class="session-summary demo-node-handle" data-variant={data.variant} in:fade={{ duration }}>
  <div class="session-content-swap">
    {#key data.variant}
      <div class="session-content" in:fly={{ y: 4, duration }} out:fade={{ duration: duration / 2 }}>
        {#if data.variant === SESSION_VIEW.prompt || data.variant === SESSION_VIEW.chat}
          <p class="session-request" class:session-request-bubble={data.variant === SESSION_VIEW.chat} data-demo-target="prompt" data-umami-mask>{data.prompt}</p>
        {/if}
        <div class="session-latest">
          {#key data.step}
            <div class="session-update" in:fly={{ y: 5, duration }} out:fade={{ duration: duration / 2 }}>
              {#if data.variant !== SESSION_VIEW.title}<p class="session-agent-text">{activity.text}</p>{/if}
              <div class="session-action" class:is-complete={data.phase === DEMO_PHASE.ready}><i aria-hidden="true"></i><span>{activity.action}</span></div>
            </div>
          {/key}
        </div>
        {#if data.variant === SESSION_VIEW.activity}<p class="session-request session-request-reference" data-demo-target="prompt" data-umami-mask>{data.prompt}</p>{/if}
        {#if data.variant === SESSION_VIEW.title}<span class="session-hidden-anchor" data-demo-target="prompt" aria-hidden="true"></span>{/if}
      </div>
    {/key}
  </div>
</div>
<style>
  .session-summary { display: block; padding: 12px; cursor: grab; }
  .session-content-swap, .session-latest { display: grid; }
  .session-content, .session-update { grid-area: 1 / 1; }
  .session-content { min-width: 0; }
  .session-request { margin: 0 0 14px; font-size: 12px; line-height: 1.55; color: #bdbdbd; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
  .session-agent-text { margin: 0 0 11px; color: #ededed; font-size: 13px; line-height: 1.5; min-height: 39px; }
  .session-action { display: flex; align-items: center; gap: 7px; color: var(--demo-added); font-size: 11px; min-height: 18px; }
  .session-action i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .session-action.is-complete { color: #afafaf; }
  .session-action.is-complete i { background: transparent; border: 1px solid currentColor; }
  .session-request-reference { margin: 14px 0 0; padding-top: 10px; border-top: 1px solid #333; -webkit-line-clamp: 1; font-size: 11px; color: #afafaf; }
  .session-request-bubble { width: fit-content; max-width: 88%; margin-left: auto; padding: 7px 9px; border-radius: 6px; background: #272727; color: #dedede; }
  .session-hidden-anchor { display: block; height: 1px; }
  [data-variant='prompt'] { min-height: 158px; }
  [data-variant='activity'] { min-height: 140px; }
  [data-variant='title'] { min-height: 56px; }
  [data-variant='chat'] { min-height: 172px; }
  .session-summary { transition: min-height 200ms ease; }
  @media (prefers-reduced-motion: reduce) { .session-summary { transition: none; } }
</style>
