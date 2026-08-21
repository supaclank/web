<script>
  const MODE_MOBILE = 'mobile';
  const MODE_WEB = 'web';
  const PROMPT_SUGGESTIONS = [
    'A calmer habit tracker with a tiny garden',
    'A recipe camera that builds a weekly menu',
    'A shared packing list for group trips'
  ];

  let {
    busy = false,
    phase = 'idle',
    detail = '',
    error = '',
    needsPay = false,
    onmobilecreate,
    onrepositoryopen
  } = $props();

  let mode = $state(MODE_MOBILE);
  let prompt = $state('');
  let repository = $state('');

  function submit(event) {
    event.preventDefault();
    if (mode === MODE_MOBILE) onmobilecreate(prompt);
    else onrepositoryopen(repository);
  }
</script>

<section class="create-hero" id="create" aria-labelledby="create-heading">
  <div class="hero-copy">
    <img src="/mascot.png" alt="" width="48" height="48" />
    <p>YOUR CREATIVE WORKSHOP</p>
    <h1 id="create-heading">What do you want to build?</h1>
    <span>Start with an idea. Your workspace wakes up and Clank builds the first version with you.</span>
  </div>

  <form class="composer" class:working={busy} onsubmit={submit}>
    <div class="mode-switch" aria-label="What are you creating?">
      <button id="mobile-mode" type="button" class:active={mode === MODE_MOBILE} aria-pressed={mode === MODE_MOBILE} onclick={() => (mode = MODE_MOBILE)}>
        <i class="phone-icon" aria-hidden="true"></i><span><b>Mobile app</b><small>Expo · browser preview</small></span>
      </button>
      <button id="web-mode" type="button" class:active={mode === MODE_WEB} aria-pressed={mode === MODE_WEB} onclick={() => (mode = MODE_WEB)}>
        <i class="browser-icon" aria-hidden="true"></i><span><b>Web project</b><small>From GitHub</small></span>
      </button>
    </div>

    {#if mode === MODE_MOBILE}
      <label for="app-prompt" class="sr-only">Describe your mobile app</label>
      <textarea
        id="app-prompt"
        bind:value={prompt}
        placeholder="Describe the app you want to make…"
        rows="4"
        required
        disabled={busy || needsPay}
      ></textarea>
      <div class="composer-footer">
        <span><i></i> Expo Web first · open on your phone when needed</span>
        <button type="submit" disabled={busy || needsPay || !prompt.trim()}>
          {busy ? 'Building…' : 'Start building'} <i aria-hidden="true">↑</i>
        </button>
      </div>
    {:else}
      <div class="repository-input">
        <label for="repository">GitHub repository</label>
        <div><span>github.com/</span><input id="repository" bind:value={repository} placeholder="owner/repository" autocomplete="off" spellcheck="false" required disabled={busy || needsPay} /></div>
      </div>
      <div class="composer-footer web-footer">
        <span>We create a private branch and live browser preview.</span>
        <button type="submit" disabled={busy || needsPay || !repository.trim()}>Open project <i aria-hidden="true">→</i></button>
      </div>
    {/if}

    {#if busy}
      <div class="build-status" aria-live="polite"><i></i><span><b>{phase === 'building' ? 'Clank is building your first version' : 'Preparing your workspace'}</b>{detail}</span></div>
    {/if}
    {#if error}<p class="composer-error" role="alert">{error}</p>{/if}
    {#if needsPay}<p class="composer-error">Renew your workspace to start something new. Your existing work is still safe.</p>{/if}
  </form>

  {#if mode === MODE_MOBILE && !busy}
    <div class="suggestions" aria-label="Prompt ideas">
      <span>Try an idea</span>
      {#each PROMPT_SUGGESTIONS as suggestion}
        <button type="button" onclick={() => (prompt = suggestion)}>{suggestion}</button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .create-hero { max-width: 760px; margin: 0 auto; padding: 58px 0 50px; text-align: center; }
  .hero-copy img { border-radius: 14px; box-shadow: 0 7px 18px rgba(51, 38, 31, .09); }
  .hero-copy p { margin: 17px 0 9px; color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 650; letter-spacing: .11em; }
  .hero-copy h1 { margin: 0; font-size: clamp(34px, 5vw, 49px); font-weight: 620; letter-spacing: -.05em; line-height: 1.04; }
  .hero-copy > span { display: block; max-width: 560px; margin: 13px auto 0; color: var(--color-muted); font-size: 14px; line-height: 1.55; }
  .composer { position: relative; margin-top: 29px; border: 1px solid rgba(52, 42, 36, .19); border-radius: 18px; background: rgba(255, 255, 255, .95); box-shadow: 0 18px 45px rgba(56, 43, 36, .11), 0 2px 6px rgba(56, 43, 36, .05); text-align: left; transition: border-color .18s, box-shadow .18s; }
  .composer:focus-within { border-color: rgba(250, 85, 115, .52); box-shadow: 0 20px 50px rgba(56, 43, 36, .13), 0 0 0 3px rgba(250, 85, 115, .08); }
  .composer.working { border-color: rgba(250, 85, 115, .35); }
  .mode-switch { display: flex; gap: 5px; padding: 7px 8px 0; }
  .mode-switch button { display: flex; min-height: 46px; align-items: center; gap: 9px; border: 0; border-radius: 11px; padding: 6px 12px; background: transparent; color: var(--color-muted); text-align: left; }
  .mode-switch button:hover { background: #f7f4ee; color: var(--color-ink); }
  .mode-switch button.active { background: #f3efe8; color: var(--color-ink); }
  .mode-switch button > i { position: relative; display: block; width: 19px; height: 19px; flex: none; }
  .phone-icon::before { position: absolute; inset: 1px 5px; border: 1.5px solid currentColor; border-radius: 3px; content: ''; }
  .phone-icon::after { position: absolute; bottom: 3px; left: 8px; width: 3px; height: 1.5px; border-radius: 2px; background: currentColor; content: ''; }
  .browser-icon { border: 1.5px solid currentColor; border-radius: 3px; }
  .browser-icon::before { position: absolute; top: 4px; right: 0; left: 0; height: 1px; background: currentColor; content: ''; opacity: .6; }
  .mode-switch b, .mode-switch small { display: block; }
  .mode-switch b { font-size: 11px; font-weight: 650; }
  .mode-switch small { margin-top: 1px; color: var(--color-dim); font-size: 8px; }
  textarea { display: block; width: 100%; min-height: 122px; resize: none; border: 0; padding: 19px 21px 12px; outline: 0; background: transparent; color: var(--color-ink); font: inherit; font-size: 17px; line-height: 1.55; }
  textarea::placeholder { color: #aaa39a; }
  .composer-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 11px 11px 20px; }
  .composer-footer > span { display: flex; align-items: center; gap: 7px; color: var(--color-dim); font-size: 10px; }
  .composer-footer > span > i { width: 6px; height: 6px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 3px rgba(47, 163, 122, .1); }
  .composer-footer > button { display: inline-flex; min-height: 42px; flex: none; align-items: center; justify-content: center; border: 0; border-radius: 11px; padding: 0 13px 0 16px; background: var(--color-brand); color: #fff; font-size: 12px; font-weight: 650; white-space: nowrap; box-shadow: 0 5px 13px rgba(250, 85, 115, .2); }
  .composer-footer > button i { display: inline-grid; width: 23px; height: 23px; margin-left: 7px; place-items: center; border-radius: 7px; background: rgba(255,255,255,.17); font-style: normal; }
  .composer-footer > button:disabled { cursor: not-allowed; opacity: .45; box-shadow: none; }
  .repository-input { padding: 20px 20px 12px; }
  .repository-input label { display: block; margin-bottom: 8px; color: var(--color-muted); font-size: 10px; font-weight: 650; letter-spacing: .05em; text-transform: uppercase; }
  .repository-input > div { display: flex; min-height: 52px; align-items: center; border: 1px solid var(--color-line); border-radius: 11px; background: #faf8f4; }
  .repository-input span { padding-left: 14px; color: var(--color-dim); font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  .repository-input input { min-width: 0; flex: 1; border: 0; padding: 14px 5px; outline: 0; background: transparent; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  .web-footer { padding-top: 3px; }
  .build-status { display: flex; align-items: center; gap: 12px; margin: 0 11px 11px; border-radius: 11px; padding: 12px 13px; background: #fff3f5; }
  .build-status > i { width: 17px; height: 17px; flex: none; border: 2px solid #ffc2ce; border-top-color: var(--color-brand); border-radius: 50%; animation: spin .8s linear infinite; }
  .build-status span, .build-status b { display: block; }
  .build-status span { color: var(--color-muted); font-size: 10px; }
  .build-status b { margin-bottom: 2px; color: var(--color-ink); font-size: 11px; }
  .composer-error { margin: 0 13px 12px; color: var(--color-danger); font-size: 11px; }
  .suggestions { display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 13px; }
  .suggestions > span { color: var(--color-dim); font-size: 9px; }
  .suggestions button { border: 1px solid var(--color-line-subtle); border-radius: 99px; padding: 6px 9px; background: rgba(255,255,255,.58); color: var(--color-muted); font-size: 9px; }
  .suggestions button:hover { border-color: var(--color-line); background: #fff; color: var(--color-ink); }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 700px) {
    .create-hero { padding: 42px 0 37px; }
    .hero-copy h1 { font-size: 36px; }
    .hero-copy > span { font-size: 13px; }
    .suggestions { overflow-x: auto; justify-content: flex-start; padding-bottom: 3px; }
    .suggestions > span, .suggestions button { flex: none; }
  }
  @media (max-width: 500px) {
    .mode-switch button { flex: 1; padding-inline: 9px; }
    textarea { min-height: 140px; padding-inline: 16px; font-size: 16px; }
    .composer-footer { align-items: flex-start; padding-left: 15px; }
    .composer-footer > span { max-width: 180px; line-height: 1.4; }
    .web-footer { align-items: center; }
    .web-footer > span { display: none; }
    .web-footer > button { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) { .build-status > i { animation: none; } }
</style>
