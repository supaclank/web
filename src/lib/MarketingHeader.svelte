<script>
  let { signedIn = false } = $props();
  let mobileMenuOpen = $state(false);
</script>

<header class="sticky top-0 z-10 border-b border-line-subtle bg-paper/80 backdrop-blur">
  <div class="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
    <div class="flex items-center gap-8">
      <a href="/" class="flex items-center gap-2.5" onclick={() => (mobileMenuOpen = false)}>
        <img src="/mascot.png" alt="" width="32" height="32" class="rounded-lg" />
        <span class="text-[15px] font-semibold tracking-tight">supaclank</span>
        <span class="rounded-full border border-brand/30 bg-brand-dim px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-muted uppercase">beta</span>
      </a>
      <nav class="hidden items-center gap-6 text-sm sm:flex">
        <a href="/pricing" class="text-muted transition-colors hover:text-ink">Pricing</a>
        <a href="/demo" class="text-muted transition-colors hover:text-ink">Demo</a>
        <a href="https://github.com/Acksell/clank" class="text-muted transition-colors hover:text-ink" rel="noreferrer">GitHub</a>
      </nav>
    </div>
    <div class="flex items-center gap-1 text-sm sm:gap-2">
      {#if signedIn}
        <a href="/welcome" class="rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-brand-muted" onclick={() => (mobileMenuOpen = false)}>Account</a>
      {:else}
        <a href="/signup?mode=signin" class="hidden rounded-md px-3 py-2 whitespace-nowrap text-muted transition-colors hover:text-ink sm:block">Sign in</a>
        <a href="/get-started" class="rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-brand-muted" onclick={() => (mobileMenuOpen = false)}>Get started</a>
      {/if}
      <button type="button" class="-mr-1.5 inline-flex items-center justify-center rounded-md p-2 text-muted transition-colors hover:text-ink sm:hidden" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen} aria-controls="marketing-mobile-nav" onclick={() => (mobileMenuOpen = !mobileMenuOpen)}>
        {#if mobileMenuOpen}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        {:else}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        {/if}
      </button>
    </div>
  </div>

  {#if mobileMenuOpen}
    <nav id="marketing-mobile-nav" aria-label="Mobile" class="flex flex-col gap-1 border-t border-line-subtle px-5 py-3 text-sm sm:hidden">
      <a href="/pricing" class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink" onclick={() => (mobileMenuOpen = false)}>Pricing</a>
      <a href="/demo" class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink" onclick={() => (mobileMenuOpen = false)}>Demo</a>
      <a href="https://github.com/Acksell/clank" rel="noreferrer" class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink" onclick={() => (mobileMenuOpen = false)}>GitHub</a>
      {#if !signedIn}
        <a href="/signup?mode=signin" class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink" onclick={() => (mobileMenuOpen = false)}>Sign in</a>
      {/if}
    </nav>
  {/if}
</header>
