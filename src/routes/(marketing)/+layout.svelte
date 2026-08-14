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
      <a href="/" class="flex items-center gap-2.5" aria-label="Supaclank home">
        <img src="/mascot.png" alt="" width="26" height="26" class="rounded" />
        <b class="font-pixel text-[13px] font-bold tracking-[0.05em] text-ink">SUPA<span class="text-brand">CLANK</span></b>
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
          <a href="/welcome" class="btn-raised btn-raised-primary btn-raised-sm">Account</a>
        {:else}
          <a href="/signup" class="navlink hidden sm:block">Sign in</a>
          <a href="/signup" class="btn-raised btn-raised-primary btn-raised-sm">Get started</a>
        {/if}
      </div>
    </div>
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
</style>
