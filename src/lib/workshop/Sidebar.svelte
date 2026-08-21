<script>
  let {
    email,
    planLabel,
    previewCount,
    needsPay = false,
    active = false,
    busy = false,
    error = '',
    onsubscribe,
    onmanage,
    onsignout
  } = $props();

  let initial = $derived(email.slice(0, 1).toUpperCase());

  function focusMode(modeID, inputID) {
    document.querySelector(modeID)?.click();
    setTimeout(() => document.querySelector(inputID)?.focus());
  }
</script>

<aside class="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-elevated md:flex">
  <div class="flex h-16 items-center border-b border-line-subtle px-5">
    <a href="/welcome" class="flex items-center gap-2.5 text-base font-semibold tracking-tight">
      <img src="/mascot.png" alt="" width="34" height="34" class="rounded-lg" />
      <span>supaclank</span>
    </a>
  </div>

  <div class="p-3">
    <div class="flex items-center gap-3 rounded-xl bg-surface px-3 py-3">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-dim font-medium text-brand-muted">P</span>
      <div class="min-w-0 flex-1"><small class="block text-xs text-muted">Workspace</small><strong class="block truncate text-sm font-medium">Personal</strong></div>
      <span class="text-sm text-dim" aria-hidden="true">⌄</span>
    </div>
  </div>

  <nav class="grid gap-1 px-3 text-sm" aria-label="Workspace navigation">
    <a class="flex min-h-11 items-center gap-3 rounded-lg bg-surface px-3 font-medium text-ink" href="#create"><span class="w-5 text-center text-muted" aria-hidden="true">⌂</span>Home</a>
    <a class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-muted transition-colors hover:bg-surface hover:text-ink" href="#previews"><span class="w-5 text-center" aria-hidden="true">▣</span>Recent previews <span class="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs">{previewCount}</span></a>
    <a class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-muted transition-colors hover:bg-surface hover:text-ink" href="#create" onclick={() => focusMode('#mobile-mode', '#app-prompt')}><span class="w-5 text-center" aria-hidden="true">＋</span>New mobile app</a>
    <a class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-muted transition-colors hover:bg-surface hover:text-ink" href="#create" onclick={() => focusMode('#web-mode', '#repository')}><span class="w-5 text-center" aria-hidden="true">⌘</span>Open repository</a>
    <a class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-muted transition-colors hover:bg-surface hover:text-ink" href="/demo"><span class="w-5 text-center" aria-hidden="true">◇</span>Interactive demo</a>
  </nav>

  <div class="mt-auto border-t border-line-subtle p-3">
    <div class="mb-2 flex items-center justify-between gap-3 px-2 py-2 text-sm">
      <span class="flex items-center gap-2 text-muted"><i class="h-2 w-2 rounded-full {needsPay ? 'bg-danger' : 'bg-success'}"></i>{active ? 'Pro account' : needsPay ? 'Workspace paused' : 'Free trial'}</span>
      <button type="button" class="font-medium text-brand-muted hover:underline disabled:opacity-50" disabled={busy} onclick={active ? onmanage : onsubscribe}>{planLabel}</button>
    </div>
    {#if error}<p class="mb-2 rounded-lg bg-danger/10 p-2 text-xs text-danger">{error}</p>{/if}

    <details class="group relative">
      <summary class="flex cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-paper">{initial}</span>
        <div class="min-w-0 flex-1"><strong class="block truncate text-sm font-medium">{email}</strong><small class="block text-xs text-muted">Personal account</small></div>
        <span class="text-xs text-dim" aria-hidden="true">•••</span>
      </summary>
      <div class="absolute right-0 bottom-14 left-0 rounded-xl border border-line bg-elevated p-1.5 shadow-lg">
        {#if active}<button type="button" class="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface" onclick={onmanage} disabled={busy}>Manage subscription</button>{:else}<button type="button" class="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface" onclick={onsubscribe} disabled={busy}>{needsPay ? 'Renew workspace' : 'Upgrade plan'}</button>{/if}
        <button type="button" class="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface" onclick={onsignout}>Sign out</button>
      </div>
    </details>
  </div>
</aside>

<nav class="fixed right-3 bottom-3 left-3 z-30 grid grid-cols-4 rounded-2xl border border-line bg-elevated/95 p-1.5 text-xs shadow-lg backdrop-blur md:hidden" aria-label="Mobile workspace navigation">
  <a class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-surface font-medium" href="#create"><span class="text-base">⌂</span>Home</a>
  <a class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-muted" href="#previews"><span class="text-base">▣</span>Previews</a>
  <a class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-brand font-medium text-white" href="#create"><span class="text-base">＋</span>Create</a>
  <a class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-muted" href="/demo"><span class="text-base">◇</span>Demo</a>
</nav>
