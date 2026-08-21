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

<section id="create" class="mx-auto max-w-3xl scroll-mt-6 py-10 sm:py-20" aria-labelledby="create-heading">
  <header class="mb-6 text-center">
    <h1 id="create-heading" class="text-2xl font-semibold tracking-tight sm:text-3xl">What do you want to build?</h1>
    <p class="mt-2 text-sm text-muted sm:text-base">Start with an idea. You can refine everything after the first build.</p>
  </header>

  <form class="overflow-hidden rounded-[1.35rem] border border-line bg-elevated shadow-[0_18px_50px_rgba(56,43,36,0.10),0_2px_8px_rgba(56,43,36,0.05)] transition focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand-dim" onsubmit={submit}>
    {#if mode === MODE_MOBILE}
      <label for="app-prompt" class="sr-only">Describe your mobile app</label>
      <textarea
        id="app-prompt"
        class="block min-h-24 w-full resize-none border-0 bg-transparent px-5 pt-5 pb-3 text-base leading-7 text-ink outline-none placeholder:text-dim sm:px-6 sm:pt-6"
        bind:value={prompt}
        placeholder="Describe the app you want to make…"
        rows="2"
        required
        disabled={busy || needsPay}
      ></textarea>
    {:else}
      <label for="repository" class="sr-only">GitHub repository</label>
      <textarea
        id="repository"
        class="block min-h-24 w-full resize-none border-0 bg-transparent px-5 pt-5 pb-3 font-mono text-base leading-7 text-ink outline-none placeholder:font-sans placeholder:text-dim sm:px-6 sm:pt-6"
        bind:value={repository}
        placeholder="Paste a GitHub repository…"
        rows="2"
        required
        disabled={busy || needsPay}
      ></textarea>
    {/if}

    <div class="flex items-center gap-2 px-3 pb-3 sm:px-4 sm:pb-4">
      <div class="flex items-center rounded-xl bg-surface p-1" aria-label="What are you creating?">
        <button
          id="mobile-mode"
          type="button"
          class="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm transition {mode === MODE_MOBILE ? 'bg-elevated font-medium text-ink shadow-sm' : 'text-muted hover:text-ink'}"
          aria-pressed={mode === MODE_MOBILE}
          onclick={() => (mode = MODE_MOBILE)}
        ><span class="text-brand-muted" aria-hidden="true">▯</span><span>Mobile app</span></button>
        <button
          id="web-mode"
          type="button"
          class="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm transition {mode === MODE_WEB ? 'bg-elevated font-medium text-ink shadow-sm' : 'text-muted hover:text-ink'}"
          aria-pressed={mode === MODE_WEB}
          onclick={() => (mode = MODE_WEB)}
        ><span aria-hidden="true">⌘</span><span>Web project</span></button>
      </div>

      <span class="hidden text-sm text-muted sm:block">{mode === MODE_MOBILE ? 'Expo app · browser preview' : 'Open an existing GitHub project'}</span>

      <button
        type="submit"
        class="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-medium text-white shadow-sm transition hover:bg-brand-muted disabled:cursor-not-allowed disabled:bg-surface disabled:text-dim disabled:shadow-none"
        aria-label={mode === MODE_MOBILE ? 'Start building' : 'Open project'}
        disabled={busy || needsPay || (mode === MODE_MOBILE ? !prompt.trim() : !repository.trim())}
      ><span aria-hidden="true">↑</span></button>
    </div>

    {#if busy}
      <div class="mx-3 mb-3 flex items-center gap-3 rounded-xl bg-brand-dim p-4 sm:mx-4 sm:mb-4" aria-live="polite">
        <span class="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand/30 border-t-brand"></span>
        <span><strong class="block text-sm font-medium">{phase === 'building' ? 'Building your first version' : 'Preparing your workspace'}</strong><span class="mt-0.5 block text-sm text-muted">{detail}</span></span>
      </div>
    {/if}
    {#if error}<p class="mx-3 mb-3 rounded-lg bg-danger/10 p-3 text-sm text-danger sm:mx-4 sm:mb-4" role="alert">{error}</p>{/if}
    {#if needsPay}<p class="mx-3 mb-3 rounded-lg bg-warning/10 p-3 text-sm text-warning sm:mx-4 sm:mb-4">Renew your workspace to start something new. Your existing work is still safe.</p>{/if}
  </form>

  <p class="mt-2 text-center text-xs text-muted sm:hidden">{mode === MODE_MOBILE ? 'Expo Web preview · open natively for device-only features' : 'Opens an existing GitHub repository'}</p>

  {#if mode === MODE_MOBILE && !busy}
    <div class="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Prompt ideas">
      {#each PROMPT_SUGGESTIONS as suggestion}
        <button type="button" class="shrink-0 rounded-full border border-line bg-elevated/85 px-3 py-2 text-sm text-muted shadow-sm transition hover:border-brand/40 hover:bg-elevated hover:text-ink" onclick={() => (prompt = suggestion)}>{suggestion}</button>
      {/each}
    </div>
  {/if}
</section>
