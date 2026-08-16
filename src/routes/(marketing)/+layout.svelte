<script>
  // Shared chrome for public marketing pages: the Meadow world (fixed pixel
  // sky + terrain behind everything), the nav, and the soil footer finale.
  // Auth routes stay outside this group so sign-in and consent do not
  // inherit marketing navigation.
  import { onMount } from 'svelte';
  import MeadowWorld from '$lib/meadow/MeadowWorld.svelte';
  import FooterMeadow from '$lib/meadow/FooterMeadow.svelte';

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

<MeadowWorld />

<div class="relative z-[1] flex min-h-screen flex-col">
  <header class="sticky top-0 z-50 border-b border-line bg-paper/92 backdrop-blur-sm">
    <div class="mx-auto flex h-[60px] w-full max-w-[1180px] items-center gap-7 px-5 sm:px-7">
      <a href="/" class="flex items-center gap-2.5" aria-label="Supaclank home" onclick={() => (mobileMenuOpen = false)}>
        <img src="/mascot.png" alt="" width="40" height="40" class="rounded" />
        <b class="text-[17px] font-semibold tracking-tight text-ink">supaclank</b>
      </a>
      <nav class="ml-2 hidden items-center gap-6 min-[880px]:flex" aria-label="Main">
        <a href="/#capabilities" class="navlink">Capabilities</a>
        <a href="/#how" class="navlink">How it works</a>
        <a href="/pricing" class="navlink">Pricing</a>
        <a href="/demo" class="navlink">Demo</a>
        <a href="https://github.com/Acksell/clank" rel="noreferrer" class="navlink">GitHub</a>
      </nav>
      <div class="ml-auto flex items-center gap-4">
        {#if signedIn}
          <a href="/welcome" class="btn-raised btn-raised-primary btn-raised-sm" onclick={() => (mobileMenuOpen = false)}>Account</a>
        {:else}
          <a href="/signup" class="navlink hidden sm:block">Sign in</a>
          <a href="/signup" class="btn-raised btn-raised-primary btn-raised-sm" onclick={() => (mobileMenuOpen = false)}>Get started</a>
        {/if}
        <button
          type="button"
          class="menu-btn min-[880px]:hidden"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="marketing-mobile-nav"
          onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
        >
          {#if mobileMenuOpen}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    {#if mobileMenuOpen}
      <nav
        id="marketing-mobile-nav"
        aria-label="Mobile"
        class="flex flex-col gap-2 border-t border-line px-5 py-3 min-[880px]:hidden"
      >
        <a href="/#capabilities" class="navlink" onclick={() => (mobileMenuOpen = false)}>Capabilities</a>
        <a href="/#how" class="navlink" onclick={() => (mobileMenuOpen = false)}>How it works</a>
        <a href="/pricing" class="navlink" onclick={() => (mobileMenuOpen = false)}>Pricing</a>
        <a href="/demo" class="navlink" onclick={() => (mobileMenuOpen = false)}>Demo</a>
        <a href="https://github.com/Acksell/clank" rel="noreferrer" class="navlink" onclick={() => (mobileMenuOpen = false)}>GitHub</a>
        {#if !signedIn}
          <a href="/signup" class="navlink" onclick={() => (mobileMenuOpen = false)}>Sign in</a>
        {/if}
      </nav>
    {/if}
  </header>

  <main class="flex-1">
    {@render children()}
  </main>

  <FooterMeadow {signedIn} />
</div>

<style>
  .navlink {
    font: 500 13.5px var(--font-sans);
    color: var(--color-muted);
    text-decoration: none;
    padding: 4px 2px;
    border-bottom: 1px solid transparent;
    white-space: nowrap;
  }
  .navlink:hover {
    color: var(--color-ink);
    border-bottom-color: var(--color-brand);
  }
  .menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: -6px;
    padding: 8px;
    border: none;
    background: transparent;
    color: var(--color-muted);
    border-radius: 2px;
    cursor: pointer;
  }
  .menu-btn:hover {
    color: var(--color-ink);
  }
</style>
