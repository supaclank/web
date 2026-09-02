<script>
  // Shared chrome for public marketing pages. Auth routes stay outside this
  // group so sign-in and consent do not inherit marketing navigation.
  import { onMount } from 'svelte';
  import MarketingHeader from '$lib/MarketingHeader.svelte';

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

<div class="flex min-h-screen flex-col">
  <MarketingHeader {signedIn} />

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
          <a href="/signup?mode=signin" class="transition-colors hover:text-ink">Sign in</a>
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
