<script>
  // Shared chrome for public marketing pages. Auth routes stay outside this
  // group so sign-in and consent do not inherit marketing navigation.
  import { onMount } from 'svelte';

  let { children } = $props();

  // Pages prerender with the signed-out buttons; swap to the account link
  // only once a session is found so signed-out visitors never see a flicker.
  let signedIn = $state(false);
  let mobileMenuOpen = $state(false);

  onMount(async () => {
    const { createSupabase } = await import('$lib/supabase');
    const supabase = createSupabase();
    const { data } = await supabase.auth.getSession();
    signedIn = Boolean(data.session);
  });
</script>

<div class="flex min-h-screen flex-col">
  <header
    class="sticky top-0 z-10 border-b border-line-subtle bg-paper/80 backdrop-blur"
  >
    <div class="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
      <div class="flex items-center gap-8">
        <a href="/" class="flex items-center gap-2.5" onclick={() => (mobileMenuOpen = false)}>
          <img src="/mascot.png" alt="" width="32" height="32" class="rounded-lg" />
          <span class="text-[15px] font-semibold tracking-tight">supaclank</span>
          <span
            class="rounded-full border border-brand/30 bg-brand-dim px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-muted uppercase"
            >beta</span
          >
        </a>
        <nav class="hidden items-center gap-6 text-sm sm:flex">
          <a href="/pricing" class="text-muted transition-colors hover:text-ink">Pricing</a>
          <a href="/demo" class="text-muted transition-colors hover:text-ink">Demo</a>
          <a
            href="https://github.com/Acksell/clank"
            class="text-muted transition-colors hover:text-ink"
            rel="noreferrer">GitHub</a
          >
        </nav>
      </div>
      <div class="flex items-center gap-1 text-sm sm:gap-2">
        <div class="hidden items-center gap-3 sm:flex">
          <a
            href="https://discord.gg/EcPnHz5eWm"
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            class="text-muted transition-colors hover:text-ink"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" /></svg>
          </a>
          <a
            href="https://x.com/supaclank"
            target="_blank"
            rel="noreferrer"
            aria-label="X"
            class="text-muted transition-colors hover:text-ink"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" /></svg>
          </a>
          <span class="h-4 w-px bg-line-subtle"></span>
        </div>
        {#if signedIn}
          <a
            href="/welcome"
            class="rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-brand-muted"
            onclick={() => (mobileMenuOpen = false)}>Account</a
          >
        {:else}
          <a
            href="/signup"
            class="hidden rounded-md px-3 py-2 whitespace-nowrap text-muted transition-colors hover:text-ink sm:block"
            >Sign in</a
          >
          <a
            href="/signup"
            class="rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-brand-muted"
            onclick={() => (mobileMenuOpen = false)}>Get started</a
          >
        {/if}
        <button
          type="button"
          class="-mr-1.5 inline-flex items-center justify-center rounded-md p-2 text-muted transition-colors hover:text-ink sm:hidden"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="marketing-mobile-nav"
          onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
        >
          {#if mobileMenuOpen}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5.5h14M3 10h14M3 14.5h14"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    {#if mobileMenuOpen}
      <nav
        id="marketing-mobile-nav"
        aria-label="Mobile"
        class="flex flex-col gap-1 border-t border-line-subtle px-5 py-3 text-sm sm:hidden"
      >
        <a
          href="/pricing"
          class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
          onclick={() => (mobileMenuOpen = false)}>Pricing</a
        >
        <a
          href="/demo"
          class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
          onclick={() => (mobileMenuOpen = false)}>Demo</a
        >
        <a
          href="https://github.com/Acksell/clank"
          rel="noreferrer"
          class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
          onclick={() => (mobileMenuOpen = false)}>GitHub</a
        >
        <a
          href="https://discord.gg/EcPnHz5eWm"
          target="_blank"
          rel="noreferrer"
          class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
          onclick={() => (mobileMenuOpen = false)}>Discord</a
        >
        <a
          href="https://x.com/supaclank"
          target="_blank"
          rel="noreferrer"
          class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
          onclick={() => (mobileMenuOpen = false)}>X</a
        >
        {#if !signedIn}
          <a
            href="/signup"
            class="rounded-md px-3 py-2 text-muted transition-colors hover:text-ink"
            onclick={() => (mobileMenuOpen = false)}>Sign in</a
          >
        {/if}
      </nav>
    {/if}
  </header>

  <main class="flex-1">
    {@render children()}
  </main>

  <footer class="border-t border-line-subtle">
    <div
      class="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row"
    >
      <div class="flex items-center gap-2">
        <img src="/mascot.png" alt="" width="20" height="20" class="rounded" />
        <span>© {new Date().getFullYear()} supaclank</span>
      </div>
      <nav class="flex flex-wrap items-center justify-center gap-5">
        <a href="/pricing" class="transition-colors hover:text-ink">Pricing</a>
        {#if signedIn}
          <a href="/welcome" class="transition-colors hover:text-ink">Account</a>
        {:else}
          <a href="/signup" class="transition-colors hover:text-ink">Sign in</a>
        {/if}
        <a href="https://github.com/Acksell/clank" rel="noreferrer" class="transition-colors hover:text-ink"
          >Open source</a
        >
        <a href="/terms" class="transition-colors hover:text-ink">Terms</a>
        <a href="/privacy" class="transition-colors hover:text-ink">Privacy</a>
      </nav>
    </div>
  </footer>
</div>
