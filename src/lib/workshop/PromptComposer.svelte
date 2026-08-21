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

<section id="create" class="mx-auto max-w-3xl scroll-mt-6" aria-labelledby="create-heading">
  <div class="mb-6">
    <h1 id="create-heading" class="text-2xl font-semibold tracking-tight sm:text-3xl">What do you want to build?</h1>
    <p class="mt-2 max-w-2xl text-base leading-6 text-muted">
      Describe the first version. Supaclank wakes your workspace, creates the project, and starts building.
    </p>
  </div>

  <form class="overflow-hidden rounded-2xl border border-line bg-elevated shadow-sm focus-within:border-brand/60 focus-within:ring-3 focus-within:ring-brand-dim" onsubmit={submit}>
    <div class="flex gap-1 border-b border-line-subtle bg-paper/60 p-2" aria-label="What are you creating?">
      <button
        id="mobile-mode"
        type="button"
        class="flex min-h-12 flex-1 items-center gap-3 rounded-lg px-3 text-left transition-colors sm:flex-none sm:px-4 {mode === MODE_MOBILE ? 'bg-elevated text-ink shadow-sm' : 'text-muted hover:bg-elevated/70 hover:text-ink'}"
        aria-pressed={mode === MODE_MOBILE}
        onclick={() => (mode = MODE_MOBILE)}
      >
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dim text-lg text-brand-muted" aria-hidden="true">▯</span>
        <span><strong class="block text-sm font-medium">Mobile app</strong><small class="mt-0.5 block text-xs text-muted">Expo project</small></span>
      </button>
      <button
        id="web-mode"
        type="button"
        class="flex min-h-12 flex-1 items-center gap-3 rounded-lg px-3 text-left transition-colors sm:flex-none sm:px-4 {mode === MODE_WEB ? 'bg-elevated text-ink shadow-sm' : 'text-muted hover:bg-elevated/70 hover:text-ink'}"
        aria-pressed={mode === MODE_WEB}
        onclick={() => (mode = MODE_WEB)}
      >
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-base text-muted" aria-hidden="true">⌘</span>
        <span><strong class="block text-sm font-medium">Web project</strong><small class="mt-0.5 block text-xs text-muted">GitHub repository</small></span>
      </button>
    </div>

    {#if mode === MODE_MOBILE}
      <label for="app-prompt" class="sr-only">Describe your mobile app</label>
      <textarea
        id="app-prompt"
        class="block min-h-44 w-full resize-none border-0 bg-transparent p-5 text-base leading-7 text-ink outline-none placeholder:text-dim sm:min-h-48 sm:p-6"
        bind:value={prompt}
        placeholder="Describe the app you want to make…"
        rows="5"
        required
        disabled={busy || needsPay}
      ></textarea>
      <div class="flex flex-col gap-3 border-t border-line-subtle bg-paper/40 p-3 sm:flex-row sm:items-center sm:justify-between sm:pl-5">
        <span class="flex items-center gap-2 text-sm text-muted"><i class="h-2 w-2 rounded-full bg-success"></i>Expo Web preview included</span>
        <button type="submit" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 font-medium text-white transition-colors hover:bg-brand-muted disabled:cursor-not-allowed disabled:opacity-40" disabled={busy || needsPay || !prompt.trim()}>
          {busy ? 'Building…' : 'Start building'} <span aria-hidden="true">→</span>
        </button>
      </div>
    {:else}
      <div class="p-5 sm:p-6">
        <label for="repository" class="mb-2 block text-sm font-medium">GitHub repository</label>
        <div class="flex min-h-12 items-center overflow-hidden rounded-lg border border-line bg-paper focus-within:border-brand">
          <span class="pl-4 font-mono text-sm text-muted">github.com/</span>
          <input id="repository" class="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 font-mono text-sm outline-none placeholder:text-dim" bind:value={repository} placeholder="owner/repository" autocomplete="off" spellcheck="false" required disabled={busy || needsPay} />
        </div>
      </div>
      <div class="flex flex-col gap-3 border-t border-line-subtle bg-paper/40 p-3 sm:flex-row sm:items-center sm:justify-between sm:pl-5">
        <span class="text-sm text-muted">A private branch and browser preview will be created.</span>
        <button type="submit" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 font-medium text-white transition-colors hover:bg-brand-muted disabled:cursor-not-allowed disabled:opacity-40" disabled={busy || needsPay || !repository.trim()}>
          Open project <span aria-hidden="true">→</span>
        </button>
      </div>
    {/if}

    {#if busy}
      <div class="m-3 flex items-center gap-3 rounded-xl bg-brand-dim p-4" aria-live="polite">
        <span class="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand/30 border-t-brand"></span>
        <span><strong class="block text-sm font-medium">{phase === 'building' ? 'Building your first version' : 'Preparing your workspace'}</strong><span class="mt-0.5 block text-sm text-muted">{detail}</span></span>
      </div>
    {/if}
    {#if error}<p class="m-3 rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p>{/if}
    {#if needsPay}<p class="m-3 rounded-lg bg-warning/10 p-3 text-sm text-warning">Renew your workspace to start something new. Your existing work is still safe.</p>{/if}
  </form>

  {#if mode === MODE_MOBILE && !busy}
    <div class="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Prompt ideas">
      {#each PROMPT_SUGGESTIONS as suggestion}
        <button type="button" class="shrink-0 rounded-full border border-line bg-elevated px-3 py-2 text-sm text-muted transition-colors hover:border-brand/40 hover:text-ink" onclick={() => (prompt = suggestion)}>{suggestion}</button>
      {/each}
    </div>
  {/if}
</section>
