<script>
  import { previewTitle, relativePreviewAge } from '$lib/workshop.js';

  let { phase, previews, error = '', openingToken = '', onopen } = $props();
</script>

<section id="previews" class="mx-auto mt-12 max-w-4xl scroll-mt-6 pb-28 md:pb-16" aria-labelledby="preview-heading">
  <header class="mb-4 flex items-end justify-between gap-4">
    <div><h2 id="preview-heading" class="text-xl font-semibold tracking-tight">Recent work</h2><p class="mt-1 text-sm text-muted">Reopen a private preview without starting over.</p></div>
    {#if previews.length}<span class="text-sm text-muted">{previews.length} {previews.length === 1 ? 'preview' : 'previews'}</span>{/if}
  </header>

  <div class="overflow-hidden rounded-2xl border border-line bg-elevated shadow-sm">
    {#if phase === 'loading'}
      <div class="divide-y divide-line-subtle" aria-label="Loading previews">
        {#each [1, 2, 3] as item}
          <div class="flex min-h-20 items-center gap-4 p-4" aria-hidden="true"><span class="h-11 w-12 animate-pulse rounded-lg bg-surface"></span><span class="h-4 w-40 animate-pulse rounded bg-surface"></span></div>
        {/each}
      </div>
    {:else if previews.length}
      <div class="divide-y divide-line-subtle">
        {#each previews as preview}
          <article class="flex min-h-20 items-center gap-4 p-4 transition-colors hover:bg-paper/60">
            <div class="relative h-11 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-paper" aria-hidden="true"><span class="absolute top-3 left-2 h-1 w-7 rounded bg-ink"></span><i class="absolute top-5 left-2 h-1 w-5 rounded bg-dim"></i><b class="absolute right-1.5 bottom-1.5 h-2.5 w-2.5 rounded bg-brand-dim"></b></div>
            <div class="min-w-0 flex-1"><h3 class="truncate text-sm font-medium">{previewTitle(preview)}</h3><p class="mt-1 flex items-center gap-2 text-sm text-muted"><i class="h-2 w-2 rounded-full bg-success"></i>Live · {relativePreviewAge(preview.created_at)}</p></div>
            <code class="hidden font-mono text-xs text-dim sm:block">{preview.worktree_id?.slice(0, 8) || 'workspace'}</code>
            <button type="button" class="min-h-10 rounded-lg border border-line px-3 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50" disabled={openingToken === preview.token} onclick={() => onopen(preview)}>
              {openingToken === preview.token ? 'Opening…' : 'Reopen'} <span class="text-brand-muted" aria-hidden="true">↗</span>
            </button>
          </article>
        {/each}
      </div>
    {:else}
      <div class="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-dim text-xl text-brand-muted" aria-hidden="true">＋</div>
        <div class="flex-1"><h3 class="font-medium">Your first preview will appear here</h3><p class="mt-1 text-sm leading-6 text-muted">Describe a mobile app above or open a GitHub repository. Your live previews stay attached to this workspace.</p></div>
        <a href="#create" class="rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-surface">Create something</a>
      </div>
    {/if}
  </div>

  {#if error}<p class="mt-3 rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p>{/if}
</section>
