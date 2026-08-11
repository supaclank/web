<script>
  // Shared chrome for public marketing pages. Auth routes stay outside this
  // group so sign-in and consent do not inherit marketing navigation.
  import { onMount } from 'svelte';

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
  <header
    class="sticky top-0 z-10 border-b border-line-subtle bg-paper/80 backdrop-blur"
  >
    <div class="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
      <a href="/" class="flex items-center gap-2.5">
        <img src="/mascot.png" alt="" width="32" height="32" class="rounded-lg" />
        <span class="text-[15px] font-semibold tracking-tight">supaclank</span>
        <span
          class="rounded-full border border-brand/30 bg-brand-dim px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-muted uppercase"
          >beta</span
        >
      </a>
      <nav class="flex items-center gap-1 text-sm sm:gap-2">
        <a
          href="/pricing"
          class="hidden rounded-md px-3 py-2 whitespace-nowrap text-muted transition-colors hover:text-ink sm:block"
          >Pricing</a
        >
        <a
          href="/demo"
          class="hidden rounded-md px-3 py-2 whitespace-nowrap text-muted transition-colors hover:text-ink sm:block"
          >Demo</a
        >
        <a
          href="https://github.com/Acksell/clank"
          class="hidden rounded-md px-3 py-2 whitespace-nowrap text-muted transition-colors hover:text-ink sm:block"
          rel="noreferrer">GitHub</a
        >
        {#if signedIn}
          <a
            href="/welcome"
            class="rounded-lg bg-brand px-4 py-2 font-medium whitespace-nowrap text-white shadow-sm transition-colors hover:bg-brand-muted"
            >Account</a
          >
        {:else}
          <a
            href="/signup"
            class="rounded-md px-3 py-2 whitespace-nowrap text-muted transition-colors hover:text-ink"
            >Sign in</a
          >
          <a
            href="/signup"
            class="rounded-lg bg-brand px-4 py-2 font-medium whitespace-nowrap text-white shadow-sm transition-colors hover:bg-brand-muted"
            >Get started</a
          >
        {/if}
      </nav>
    </div>
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
