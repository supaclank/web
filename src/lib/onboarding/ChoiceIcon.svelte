<script>
  import { BUILD_TARGET, DEVICE, USAGE } from './preferences.js';
  let { kind, showInterface = true } = $props();
</script>

{#if kind === BUILD_TARGET.web}
  <svg class="web-laptop" width="68" height="48" viewBox="0 0 68 48" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="8" y="4" width="52" height="40" rx="4" />
    <path d="M8 13h52M13 8.5h.01M18 8.5h.01" />
    <g class="web-cursor" fill="var(--color-brand)" stroke="var(--color-brand)" stroke-width="1.4">
      <path d="M20 17v16l4.2-4.2 4 7.2 3.2-1.8-4-7.1H34L20 17Z" />
    </g>
  </svg>
{:else if kind === DEVICE.mobile}
  <svg class="phone" width="58" height="68" viewBox="0 0 58 68" fill="none" aria-hidden="true">
    <ellipse class="phone-shadow" cx="26" cy="64" rx="12" ry="2" fill="currentColor" opacity="0.12" />
    <g class="phone-body">
      <rect x="12" y="6" width="30" height="54" rx="8" fill="currentColor" />
      <rect x="9" y="3" width="30" height="54" rx="8" fill="white" stroke="currentColor" stroke-width="2.5" />
      <path d="M20 5h8M18 52h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      {#if showInterface}
        <g>
          <rect x="14" y="14" width="20" height="12" rx="3" fill="currentColor" opacity="0.12" />
          <circle cx="19" cy="20" r="2.75" fill="var(--color-brand)" />
          <path d="m23 23 3.5-4 2.5 2.5 2-2 3 3.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" />
          <rect x="14" y="29" width="9" height="10" rx="2" fill="currentColor" opacity="0.18" />
          <rect x="25" y="29" width="9" height="10" rx="2" fill="currentColor" opacity="0.1" />
          <rect x="14" y="43" width="20" height="4" rx="2" fill="currentColor" opacity="0.1" />
          <circle cx="19" cy="45" r="1.25" fill="var(--color-brand)" />
          <circle cx="24" cy="45" r="1" fill="currentColor" opacity="0.35" />
          <circle cx="29" cy="45" r="1" fill="currentColor" opacity="0.35" />
        </g>
      {/if}
      {#if !showInterface}
        <g class="floating-prompt">
          <rect x="14" y="33" width="22" height="10" rx="3" fill="currentColor" opacity="0.16" />
          <rect x="12" y="31" width="22" height="10" rx="3" fill="white" stroke="currentColor" stroke-width="1.2" />
          <path d="M17 36h9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.4" />
          <circle cx="30" cy="36" r="1.5" fill="currentColor" />
        </g>
      {/if}
      <rect x="39" y="17" width="3.5" height="13" rx="1.75" fill="currentColor" />
    </g>
  </svg>
{:else}
  {#if kind === DEVICE.laptop || kind === USAGE.local}
    <svg width="56" height="50" viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {#if kind === USAGE.local}
        <rect x="2" y="3" width="40" height="32" rx="3.5" />
        <path d="M2 11h40M8 7h.01M13 7h.01" />
        <path d="m10 17 4 4-4 4" />
        <path class="terminal-caret" d="M18 25h9" stroke="var(--color-brand)" />
      {:else}
        <rect x="2" y="1" width="40" height="30" rx="3.5" />
        <g class="floating-prompt" stroke="none">
          <rect x="10" y="17" width="26" height="9" rx="3" fill="currentColor" opacity="0.16" />
          <rect x="8" y="15" width="26" height="9" rx="3" fill="white" stroke="currentColor" stroke-width="1.2" />
          <path d="M13 19.5h13" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" opacity="0.4" />
          <circle cx="30" cy="19.5" r="1.4" fill="currentColor" />
        </g>
        <path d="M22 31v5M15 37h14" />
      {/if}
    </svg>
  {:else}
    <svg class="sandbox" width="64" height="64" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse class="sandbox-shadow" cx="24" cy="45" rx="11" ry="2" fill="currentColor" stroke="none" opacity="0.1" />
      <g class="sandbox-body">
        <path d="m24 5 16 9-16 9-16-9 16-9Z" fill="var(--color-brand)" fill-opacity="0.08" stroke="none" />
        <path d="m8 14 16 9v19L8 33V14Z" fill="white" stroke="none" />
        <path d="m40 14-16 9v19l16-9V14Z" fill="currentColor" fill-opacity="0.07" stroke="none" />
        <path d="M24 5 40 14v19l-16 9-16-9V14L24 5Zm-16 9 16 9 16-9M24 23v19" fill="none" stroke-dasharray="3 2.5" />
        <g fill="var(--color-brand)" stroke="none">
          <rect x="22" y="3" width="4" height="4" rx="0.75" />
          <rect x="6" y="12" width="4" height="4" rx="0.75" />
          <rect x="38" y="12" width="4" height="4" rx="0.75" />
          <rect x="22" y="21" width="4" height="4" rx="0.75" />
          <rect x="6" y="31" width="4" height="4" rx="0.75" />
          <rect x="22" y="40" width="4" height="4" rx="0.75" />
          <rect x="38" y="31" width="4" height="4" rx="0.75" />
        </g>
      </g>
    </svg>
  {/if}
{/if}

<style>
  .phone {
    overflow: visible;
  }

  .web-laptop {
    overflow: visible;
  }

  .web-cursor {
    transform-box: fill-box;
    transform-origin: center;
    animation: cursor-roam 6s ease-in-out infinite;
  }

  .phone-body {
    transform-box: fill-box;
    transform-origin: center;
    animation: phone-float 3.6s ease-in-out infinite;
  }

  .phone-shadow {
    transform-box: fill-box;
    transform-origin: center;
    animation: phone-shadow-float 3.6s ease-in-out infinite;
  }

  .sandbox-body,
  .sandbox-shadow {
    transform-box: fill-box;
    transform-origin: center;
    animation-duration: 3.8s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }

  .sandbox-body {
    animation-name: sandbox-float;
  }

  .sandbox-shadow {
    animation-name: sandbox-shadow-float;
  }

  .floating-prompt {
    transform-box: fill-box;
    transform-origin: center;
    animation: prompt-float 3.2s ease-in-out infinite;
  }

  .terminal-caret {
    animation: terminal-caret 1.2s step-end infinite;
  }

  @keyframes phone-float {
    0%, 100% { transform: translateY(2px) rotate(-1deg); }
    50% { transform: translateY(-4px) rotate(1deg); }
  }

  @keyframes phone-shadow-float {
    0%, 100% { transform: scaleX(1); opacity: 0.14; }
    50% { transform: scaleX(0.72); opacity: 0.06; }
  }

  @keyframes sandbox-float {
    0%, 100% { transform: translateY(1px) rotate(-1deg); }
    50% { transform: translateY(-3px) rotate(1deg); }
  }

  @keyframes sandbox-shadow-float {
    0%, 100% { transform: scaleX(1); opacity: 0.12; }
    50% { transform: scaleX(0.75); opacity: 0.05; }
  }

  @keyframes cursor-roam {
    0%, 12%, 100% { transform: translate(0, 0); }
    30% { transform: translate(18px, 3px); }
    48% { transform: translate(11px, 7px); }
    66% { transform: translate(25px, -1px); }
    84% { transform: translate(6px, 5px); }
  }

  @keyframes prompt-float {
    0%, 100% { transform: translateY(1px); }
    50% { transform: translateY(-2px); }
  }

  @keyframes terminal-caret {
    50% { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .phone-body, .phone-shadow, .sandbox-body, .sandbox-shadow, .web-cursor, .floating-prompt, .terminal-caret { animation: none; }
  }
</style>
