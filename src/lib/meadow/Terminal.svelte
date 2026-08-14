<script>
  // Canonical terminal: crenellated green top edge, prompt-first commands,
  // exactly one dim output line, and a copy button that flips to a check.
  import { onDestroy } from 'svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';

  let {
    commands = ['brew install supaclank/tap/clank', 'clank preview'],
    output = '▸ clankd running · agent connected · preview live',
    caret = false,
    placement = 'homepage'
  } = $props();

  let copied = $state(false);
  let copiedTimeout;
  onDestroy(() => clearTimeout(copiedTimeout));

  async function copy() {
    try {
      await navigator.clipboard.writeText(commands.join('\n'));
    } catch {
      return;
    }
    trackEvent(analyticsEvents.installCommandsCopied, { placement });
    copied = true;
    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => (copied = false), 1500);
  }
</script>

<div class="term" role="group" aria-label="Install commands">
  <button
    class="term-copy"
    type="button"
    onclick={copy}
    aria-label="Copy the install and preview commands"
  >
    {#if copied}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="check"><path d="M20 6 9 17l-5-5" /></svg>
    {:else}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
    {/if}
  </button>
  <div class="term-body">
    {#each commands as cmd}
      <div><span class="p">$</span> <span class="c">{cmd}</span></div>
    {/each}
    <div>
      <span class="o">{output}</span>
      {#if caret}<span class="term-caret"></span>{/if}
    </div>
  </div>
</div>

<style>
  .term {
    position: relative;
    background: #221c16;
    border: 1px solid #17120e;
    font: 400 13px/1.8 var(--font-mono);
    max-width: 520px;
    margin-top: 10px;
    box-shadow: 5px 5px 0 0 rgba(26, 23, 20, 0.12);
  }
  /* Crenellated pixel teeth on the top edge. */
  .term::before {
    content: '';
    position: absolute;
    top: -8px;
    left: -1px;
    right: -1px;
    height: 8px;
    background: repeating-linear-gradient(90deg, var(--color-meadow-mid) 0 8px, transparent 8px 16px)
      left top/16px 8px repeat-x;
  }
  .term::after {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    height: 3px;
    background: var(--color-meadow-mid);
  }
  .term-body {
    padding: 18px 52px 16px 18px;
  }
  .p {
    color: #8fc077;
  }
  .c {
    color: #f2ead9;
  }
  .o {
    color: #8a7f70;
  }
  .term-caret {
    display: inline-block;
    width: 8px;
    height: 15px;
    background: var(--color-brand);
    vertical-align: text-bottom;
    animation: blink 1.1s steps(1, end) infinite;
  }
  @keyframes blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }
  .term-copy {
    position: absolute;
    top: 12px;
    right: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid rgba(250, 248, 244, 0.28);
    color: rgba(250, 248, 244, 0.72);
    cursor: pointer;
    border-radius: 2px;
    transition:
      border-color 0.12s,
      color 0.12s;
  }
  .term-copy:hover {
    border-color: var(--color-brand);
    color: #fff;
  }
  .term-copy svg {
    display: block;
  }
  .term-copy .check {
    color: var(--color-meadow);
  }
  @media (max-width: 620px) {
    .term-body {
      font-size: 12px;
      padding: 14px 46px 13px 14px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .term-caret {
      animation: none;
    }
  }
</style>
