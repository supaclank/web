<script>
  import { onDestroy, onMount } from 'svelte';
  import PlayBadge from '$lib/PlayBadge.svelte';
  import QrPlay from '$lib/QrPlay.svelte';
  import { isSupaclankPreviewHostname } from '$lib/demo/preview-host.js';
  import {
    CLANK_APP_BASE_URL,
    DEFAULT_REPO_SLUG,
    KEYBINDS,
    OVERLAY_STEPS,
    START_COMMANDS
  } from '$lib/demo/tutorial.js';

  const COPY_RESET_DELAY_MS = 1600;

  let commandsCopied = $state(false);
  let copyResetTimer;
  let isSupaclankPreview = $state(false);
  let repoSlug = $state(DEFAULT_REPO_SLUG);
  let repoInput = $state();

  let firstOverlayStepNumber = $derived(isSupaclankPreview ? 1 : 2);
  let tutorialUrl = $derived(`${CLANK_APP_BASE_URL}/${repoSlug.trim() || DEFAULT_REPO_SLUG}`);

  onMount(() => {
    isSupaclankPreview = isSupaclankPreviewHostname(window.location.hostname);
  });

  onDestroy(() => clearTimeout(copyResetTimer));

  function focusRepoInput() {
    repoInput?.focus();
  }

  async function copyCommands() {
    await navigator.clipboard.writeText(START_COMMANDS.join('\n'));
    commandsCopied = true;
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      commandsCopied = false;
    }, COPY_RESET_DELAY_MS);
  }
</script>

<svelte:head>
  <title>Learn the Clank preview overlay</title>
  <meta
    name="description"
    content="Learn the Clank preview overlay by changing the real Supaclank website."
  />
</svelte:head>

<div class="demo-page" id="top">
  <section class="hero">
    <div class="intro">
      <p class="eyebrow">Clank preview tutorial</p>
      <h1>Learn the overlay by changing this page.</h1>
      <p class="permission">This is a sandbox. Change anything. Break everything.</p>

      <div class="local-setup">
        <p><span>Optional</span> Run Clank in your own local repo</p>
        <div class="commands">
          <button type="button" class:copied={commandsCopied} onclick={copyCommands}>
            {commandsCopied ? 'Copied' : 'Copy all'}
          </button>
          {#each START_COMMANDS as command}
            <div><span>$</span><code>{command}</code></div>
          {/each}
        </div>
      </div>

      <div class="keybinds" aria-label="Overlay keyboard shortcuts">
        {#each KEYBINDS as keybind}
          <div><kbd>{keybind.keys}</kbd><span>{keybind.action}</span></div>
        {/each}
      </div>
    </div>

    <div class="playground">
      <div class="playground-top">
        <h2>Change anything.</h2>
      </div>

      {#if !isSupaclankPreview}
        <div class="repo-line">
          <span>github.com/</span>
          <input
            type="text"
            bind:value={repoSlug}
            bind:this={repoInput}
            placeholder={DEFAULT_REPO_SLUG}
            spellcheck="false"
            autocomplete="off"
            aria-label="GitHub repository"
            style="width: {Math.max(repoSlug.length, 4) + 1}ch"
          />
          <button
            type="button"
            class="repo-line-edit"
            aria-label="Edit repository"
            onclick={focusRepoInput}
          >
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path
                fill="currentColor"
                d="M11.29.7a1 1 0 0 1 1.41 0l2.6 2.6a1 1 0 0 1 0 1.41L5.66 14.36l-4.3.99a.75.75 0 0 1-.9-.9l.99-4.3L11.29.7Zm-1.06 2.47L2.8 10.6l-.58 2.52 2.52-.58 7.43-7.43-2.94-2.94Z"
              />
            </svg>
          </button>
        </div>

        <a class="open-tutorial" href={tutorialUrl} target="_blank" rel="noreferrer">
          <span class="instruction-label"><b>1.</b> Open this website in Clank</span>
          <span class="arrow">→</span>
        </a>
      {/if}

      <ol class="try-steps">
        {#each OVERLAY_STEPS as step, index}
          <li><b>{index + firstOverlayStepNumber}.</b><span>{step}</span></li>
        {/each}
      </ol>
    </div>
  </section>

  <section class="mobile">
    <img class="mobile-mascot" src="/mascot.png" alt="" width="68" height="68" />
    <div>
      <p class="eyebrow">Edit web &amp; mobile apps from your phone</p>
      <h2>This page works in the Clank mobile app too.</h2>
      <PlayBadge />
    </div>
    <div class="qr">
      <a
        class="qr-link"
        href="https://play.google.com/store/apps/details?id=com.supaclank.clank"
        rel="noreferrer"
        aria-label="Get Clank on Google Play"
      >
        <QrPlay />
      </a>
      <span>Scan to install</span>
    </div>
  </section>
</div>

<style>
  .demo-page {
    width: min(calc(100% - 40px), 1024px);
    margin: 0 auto;
    --pink: #fa5573;
    --pink-dark: #e23e5d;
    --pink-soft: #ffe8ed;
    --surface: #f2f0ea;
    --elevated: #ffffff;
    --ink: #1a1714;
    --muted: #6b6862;
    --line: rgba(0, 0, 0, 0.1);
    --line-subtle: rgba(0, 0, 0, 0.06);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
    align-items: center;
    gap: clamp(48px, 6vw, 72px);
    min-height: calc(100vh - 128px);
    padding: clamp(56px, 8vh, 88px) 0;
  }

  .eyebrow {
    margin: 0 0 16px;
    color: var(--pink-dark);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    max-width: 540px;
    margin-bottom: 20px;
    font-size: clamp(40px, 5vw, 48px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }

  .permission {
    max-width: 480px;
    margin-bottom: 30px;
    color: var(--muted);
    font-size: 18px;
    line-height: 1.5;
  }

  .local-setup {
    margin-bottom: 24px;
  }

  .local-setup > p {
    margin-bottom: 12px;
    color: var(--muted);
    font-size: 14px;
  }

  .local-setup > p span {
    margin-right: 5px;
    border-radius: 999px;
    padding: 3px 6px;
    color: var(--pink-dark);
    background: var(--pink-soft);
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .commands {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 14px 16px;
    background: var(--ink);
  }

  .commands > button {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 6px;
    padding: 5px 8px;
    color: rgba(255, 255, 255, 0.58);
    background: rgba(255, 255, 255, 0.08);
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 650;
    cursor: pointer;
  }

  .commands > button:hover,
  .commands > button.copied {
    color: white;
    background: rgba(255, 255, 255, 0.14);
  }

  .commands div {
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 8px;
    padding: 5px 0;
  }

  .commands span {
    color: var(--pink);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }

  code,
  kbd {
    font-family: 'JetBrains Mono', monospace;
  }

  .commands code {
    overflow: hidden;
    padding-right: 55px;
    color: white;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  kbd {
    border: 1px solid var(--line);
    border-bottom-width: 2px;
    border-radius: 5px;
    padding: 2px 5px;
    color: var(--ink);
    background: var(--elevated);
    font-size: 0.84em;
    font-weight: 650;
  }

  .keybinds {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
  }

  .keybinds div {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .keybinds kbd {
    font-size: 11px;
  }

  .keybinds span {
    color: var(--muted);
    font-size: 13px;
  }

  .playground {
    width: 100%;
    max-width: 440px;
    justify-self: end;
    border: 1px solid var(--line-subtle);
    border-radius: 16px;
    padding: 24px;
    background: var(--surface);
  }

  .playground-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 6px;
  }

  .playground-top h2 {
    max-width: 390px;
    margin: 0;
    color: var(--pink);
    font-size: clamp(23px, 2.5vw, 27px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .repo-line {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }

  .repo-line span {
    color: var(--muted);
  }

  .repo-line input {
    border: 0;
    border-bottom: 1.5px dashed rgba(250, 85, 115, 0.45);
    padding: 0;
    color: var(--pink);
    background: transparent;
    font: inherit;
    font-weight: 700;
    caret-color: var(--pink);
    transition:
      width 100ms ease,
      border-color 150ms ease;
  }

  .repo-line input:hover {
    border-bottom-color: var(--pink);
  }

  .repo-line input:focus {
    border-bottom-style: solid;
    border-bottom-color: var(--pink);
    outline: none;
  }

  .repo-line-edit {
    display: flex;
    align-items: center;
    margin-left: 6px;
    border: 0;
    padding: 2px;
    color: var(--muted);
    background: transparent;
    cursor: pointer;
  }

  .repo-line-edit:hover {
    color: var(--pink);
  }

  .open-tutorial,
  .try-steps li {
    display: flex;
    align-items: baseline;
    gap: 10px;
    border-top: 1px solid var(--line);
    padding: 21px 2px;
    color: var(--ink);
    font-size: clamp(19px, 2vw, 22px);
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -0.025em;
  }

  .open-tutorial {
    justify-content: space-between;
    text-decoration: none;
    transition:
      color 150ms ease,
      transform 150ms ease;
  }

  .open-tutorial:hover {
    color: var(--pink);
    transform: translateX(2px);
  }

  .instruction-label {
    display: flex;
    flex: 1;
    align-items: baseline;
    gap: 10px;
  }

  .instruction-label b,
  .try-steps li > b {
    flex: 0 0 25px;
    font-size: 0.72em;
    letter-spacing: 0;
  }

  .open-tutorial .arrow {
    color: var(--pink);
    font-size: 1em;
    line-height: 1;
  }

  .try-steps {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mobile {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 28px;
    margin: 0 0 70px;
    border-radius: 16px;
    padding: 32px;
    color: white;
    background: var(--pink);
  }

  .mobile-mascot {
    border-radius: 14px;
  }

  .mobile .eyebrow {
    margin-bottom: 7px;
    color: rgba(255, 255, 255, 0.72);
  }

  .mobile h2 {
    max-width: 560px;
    margin-bottom: 13px;
    font-size: clamp(25px, 3vw, 32px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 8px;
    padding: 10px;
    color: var(--ink);
    background: white;
  }

  .qr-link {
    display: block;
    width: 95px;
    height: 95px;
  }

  .qr > span {
    margin-top: 3px;
    color: var(--muted);
    font-size: 8px;
  }

  @media (max-width: 760px) {
    .hero {
      grid-template-columns: 1fr;
      padding-top: 64px;
    }

    .intro {
      max-width: 680px;
    }

    .playground {
      width: min(100%, 520px);
      justify-self: center;
    }
  }

  @media (max-width: 640px) {
    .demo-page {
      width: min(calc(100% - 28px), 1180px);
    }

    .hero {
      min-height: 0;
      gap: 40px;
      padding: 48px 0 56px;
    }

    h1 {
      font-size: clamp(38px, 12vw, 48px);
    }

    .permission {
      font-size: 15px;
    }

    .commands {
      padding-top: 42px;
    }

    .commands code {
      overflow: visible;
      padding-right: 0;
      text-overflow: clip;
      white-space: normal;
    }

    .playground {
      padding: 17px;
    }

    .mobile {
      grid-template-columns: 1fr;
      justify-items: start;
      padding: 30px;
    }

    .qr {
      justify-self: start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      transition-duration: 0.01ms !important;
    }
  }
</style>
