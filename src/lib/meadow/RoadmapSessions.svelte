<script>
  // Roadmap as an agent session list, with a product-style prompt box that
  // queues the visitor's idea. Ideas post fire-and-forget to the same Apps
  // Script sheet as the old feedback form, and appear optimistically as a
  // new Queued session row.
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';

  // First-impression / roadmap feedback lands in the public Apps Script sheet.
  const FEEDBACK_URL =
    'https://script.google.com/macros/s/AKfycbyl6w8j6GW2syXMFvhw7I-9wNrw2Gu0caonu6bifmyq1ARXaXzQQCmYRBOVe3qJ0Ar_2A/exec';

  const roadmap = [
    { title: 'Frame-drop detection & debugging', status: 'prog', delay: '0s' },
    { title: 'Preview links on every pull request', status: 'prog', delay: '-1.1s' },
    { title: 'iOS', status: 'queue' }
  ];

  let idea = $state('');
  let queued = $state([]);

  function submit(e) {
    e.preventDefault();
    const text = idea.trim();
    if (!text) return;
    // no-cors: fire-and-forget append; [text, ISO timestamp] matches the
    // sheet's appendRow shape used by the old first-impressions form.
    fetch(FEEDBACK_URL, {
      method: 'POST',
      mode: 'no-cors',
      redirect: 'follow',
      body: JSON.stringify([`[roadmap] ${text}`, new Date().toISOString()])
    }).catch(() => {});
    trackEvent(analyticsEvents.feedbackSubmitted, { placement: 'roadmap' });
    queued = [...queued, { title: text, id: Date.now() }];
    idea = '';
  }
</script>

<div class="sessions panel-raised">
  <div class="sess-head"><i></i>agent sessions</div>
  <ul aria-live="polite">
    {#each roadmap as item (item.title)}
      <li>
        <span class="sdot" class:live={item.status === 'prog'} style:animation-delay={item.delay}></span>
        <span class="stitle">{item.title}</span>
        {#if item.status === 'prog'}
          <span class="sbadge prog">In progress</span>
        {:else}
          <span class="sbadge queue">Queued</span>
        {/if}
      </li>
    {/each}
    {#each queued as q (q.id)}
      <li class="flash">
        <span class="sdot"></span>
        <span class="stitle">{q.title}</span>
        <span class="stime">just now</span>
        <span class="sbadge queue">Queued</span>
      </li>
    {/each}
  </ul>
</div>

<div class="road-prompt">
  <form onsubmit={submit}>
    <div class="rp-top">
      <input
        bind:value={idea}
        type="text"
        maxlength="120"
        placeholder="What should we build next?"
        aria-label="Suggest what to build next"
      />
      <svg class="handle" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
        <circle cx="37.5" cy="30" r="8" /><circle cx="62.5" cy="30" r="8" />
        <circle cx="37.5" cy="50" r="8" /><circle cx="62.5" cy="50" r="8" />
        <circle cx="37.5" cy="70" r="8" /><circle cx="62.5" cy="70" r="8" />
      </svg>
    </div>
    <div class="rp-bar">
      <svg class="ptool" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 38 L18 18 L38 18" /><path d="M62 18 L82 18 L82 38" />
        <path d="M18 62 L18 82 L38 82" /><path d="M62 82 L82 82 L82 62" />
      </svg>
      <svg class="ptool" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M65 25 L65 65 C65 85 50 90 35 75 L35 35 C35 20 50 15 55 30 L55 60" />
      </svg>
      <button class="rp-send" type="submit" aria-label="Send suggestion">
        <svg width="14" height="14" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M50 75 L50 25" /><path d="M30 45 L50 25 L70 45" />
        </svg>
      </button>
    </div>
  </form>
</div>

<style>
  .sessions {
    max-width: 760px;
  }
  .sess-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--color-line);
    font: 500 11px var(--font-mono);
    letter-spacing: 0.14em;
    color: var(--color-dim);
    text-transform: uppercase;
  }
  .sess-head i {
    width: 7px;
    height: 7px;
    background: var(--color-meadow);
    display: block;
  }
  .sessions ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sessions li {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--color-line);
  }
  .sessions li:last-child {
    border-bottom: none;
  }
  .sdot {
    width: 9px;
    height: 9px;
    flex: none;
    background: var(--color-dim);
  }
  .sdot.live {
    background: var(--color-brand);
    animation: dotpulse 2.2s ease-in-out infinite;
  }
  @keyframes dotpulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.35;
    }
  }
  .stitle {
    font: 600 15px var(--font-sans);
    color: var(--color-ink);
    min-width: 0;
  }
  .stime {
    font: 400 9.5px var(--font-mono);
    color: var(--color-dim);
    border: 1px solid var(--color-line);
    padding: 2px 6px;
    white-space: nowrap;
  }
  .sbadge {
    margin-left: auto;
    flex: none;
    font: 700 10px var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 9px;
    border-radius: 2px;
  }
  .sbadge.prog {
    color: var(--color-brand);
    background: var(--color-brand-dim);
    border: 1px solid rgba(250, 85, 115, 0.35);
  }
  .sbadge.queue {
    color: var(--color-dim);
    background: var(--color-surface);
    border: 1px solid var(--color-line);
  }
  li.flash {
    animation: rowflash 1s ease-out;
  }
  @keyframes rowflash {
    from {
      background: rgba(127, 176, 105, 0.28);
    }
    to {
      background: transparent;
    }
  }

  .road-prompt {
    max-width: 560px;
    margin-top: 26px;
  }
  .road-prompt form {
    position: relative;
    background: #fff;
    border-radius: 14px;
    padding: 14px 14px 12px;
    box-shadow:
      0 2px 14px rgba(26, 23, 20, 0.12),
      0 0 0 1px rgba(26, 23, 20, 0.06);
  }
  .rp-top {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .rp-top input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font: 400 15px var(--font-sans);
    color: var(--color-ink);
    padding: 2px 0;
  }
  .rp-top input::placeholder {
    color: #bdbdbd;
  }
  .handle {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    color: #bdbdbd;
    flex: none;
  }
  .rp-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
  }
  .ptool {
    width: 16px;
    height: 16px;
    color: #9e9e9e;
    flex: none;
  }
  .rp-send {
    margin-left: auto;
    display: flex;
    height: 34px;
    width: 34px;
    align-items: center;
    justify-content: center;
    background: var(--color-brand);
    color: #fff;
    border: 1px solid var(--color-brand-deep);
    border-radius: 999px;
    cursor: pointer;
    box-shadow: 3px 3px 0 0 var(--color-brand-deep);
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      background 0.12s;
  }
  .rp-send:hover {
    background: #ff6d87;
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 0 var(--color-brand-deep);
  }
  .rp-send:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 0 var(--color-brand-deep);
  }
  .rp-send svg {
    display: block;
  }
  @media (max-width: 620px) {
    .sessions li {
      padding: 13px 14px;
      gap: 10px;
    }
    .stitle {
      font-size: 13.5px;
    }
  }
</style>
