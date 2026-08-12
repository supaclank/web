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

  let tutorialUrl = $derived(`${CLANK_APP_BASE_URL}/${repoSlug.trim() || DEFAULT_REPO_SLUG}`);

  onMount(() => {
    isSupaclankPreview = isSupaclankPreviewHostname(window.location.hostname);
  });

  onDestroy(() => clearTimeout(copyResetTimer));

  function extractRepoSlug(value) {
    const trimmed = value.trim().replace(/^https?:\/\//i, '').replace(/^(www\.)?github\.com\//i, '');
    const match = trimmed.match(/^([^/\s?#]+)\/([^/\s?#]+)/);
    if (!match) return trimmed;
    return `${match[1]}/${match[2].replace(/\.git$/i, '')}`;
  }

  function normalizeRepoSlug(event) {
    const normalized = extractRepoSlug(event.target.value);
    if (normalized !== event.target.value) {
      repoSlug = normalized;
    }
  }

  function openTutorial(event) {
    if (event.key === 'Enter') {
      window.open(tutorialUrl, '_blank', 'noopener,noreferrer');
    }
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
  {#if !isSupaclankPreview}
    <section class="launch">
      <p class="eyebrow">Web preview demo</p>
      <h1 class="launch-title">Edit any frontend, live.</h1>
      <p class="launch-lead">Enter a GitHub repo to preview it in Clank.<br />For example, this website.</p>

      <div class="repo-launch">
        <div class="repo-field">
          <svg class="repo-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
          <span class="repo-prefix">github.com/</span>
          <input
            type="text"
            bind:value={repoSlug}
            placeholder={DEFAULT_REPO_SLUG}
            spellcheck="false"
            autocomplete="off"
            aria-label="GitHub repository"
            onkeydown={openTutorial}
            oninput={normalizeRepoSlug}
          />
        </div>
        <a class="repo-open" href={tutorialUrl} target="_blank" rel="noreferrer">
          Open in Clank <span class="arrow">→</span>
        </a>
      </div>
    </section>
  {/if}

  <section class="hero">
    <div class="intro">
      <h2 class="intro-title">Learn the overlay by changing this page.</h2>
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

      <p class="repo-sub">{isSupaclankPreview ? 'To get started' : 'Once open in Clank'}</p>

      <ol class="try-steps">
        {#each OVERLAY_STEPS as step, index}
          <li><b>{index + 1}.</b><span>{step}</span></li>
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

  .launch {
    max-width: 680px;
    margin: 0 auto;
    padding: clamp(48px, 9vh, 104px) 0 clamp(36px, 6vh, 64px);
    text-align: center;
  }

  .launch-title {
    max-width: 100%;
    margin-bottom: 14px;
    font-size: clamp(38px, 5vw, 54px);
    font-weight: 600;
    line-height: 1.03;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }

  .launch-lead {
    max-width: 480px;
    margin: 0 auto 26px;
    color: var(--muted);
    font-size: 18px;
    line-height: 1.5;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
    align-items: center;
    gap: clamp(48px, 6vw, 72px);
    padding: clamp(32px, 6vh, 64px) 0 clamp(48px, 8vh, 80px);
    border-top: 1px solid var(--line-subtle);
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

  .intro-title {
    max-width: 460px;
    margin-bottom: 16px;
    font-size: clamp(27px, 3.4vw, 33px);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.03em;
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

  .repo-launch {
    display: flex;
    gap: 10px;
    width: min(100%, 560px);
    margin: 0 auto;
    text-align: left;
  }

  .repo-field {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 8px;
    border: 1.5px solid var(--line);
    border-radius: 12px;
    padding: 14px 16px;
    background: var(--elevated);
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    transition: border-color 150ms ease;
  }

  .repo-field:focus-within {
    border-color: var(--pink);
  }

  .repo-icon {
    flex: 0 0 auto;
    color: var(--muted);
  }

  .repo-prefix {
    flex: 0 0 auto;
    margin-right: -4px;
    color: var(--muted);
  }

  .repo-field input {
    flex: 1;
    min-width: 0;
    border: 0;
    padding: 0;
    color: var(--pink);
    background: transparent;
    font: inherit;
    font-weight: 700;
    caret-color: var(--pink);
    outline: none;
  }

  .repo-open {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 12px;
    padding: 14px 20px;
    color: white;
    background: var(--pink);
    font-size: 16px;
    font-weight: 650;
    white-space: nowrap;
    text-decoration: none;
    transition:
      background 150ms ease,
      transform 150ms ease;
  }

  .repo-open:hover {
    background: var(--pink-dark);
    transform: translateY(-1px);
  }

  .repo-open .arrow {
    font-size: 1.05em;
    line-height: 1;
  }

  .repo-sub {
    margin: 0 0 2px;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

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

  .try-steps li > b {
    flex: 0 0 25px;
    font-size: 0.72em;
    letter-spacing: 0;
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
      gap: 40px;
      padding: 40px 0 56px;
    }

    .launch {
      padding: 56px 0 40px;
    }

    .launch-title {
      font-size: clamp(34px, 11vw, 48px);
    }

    .repo-launch {
      flex-direction: column;
    }

    .repo-open {
      justify-content: center;
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
