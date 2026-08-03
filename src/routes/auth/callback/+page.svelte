<script>
  import { onMount } from 'svelte';
  import { safeReturnTo } from '$lib/navigation.js';

  let error = $state('');

  onMount(async () => {
    try {
      const returnTo = safeReturnTo(new URLSearchParams(location.search).get('return_to'));
      const { createSupabase } = await import('$lib/supabase');
      const supabase = createSupabase();
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session) {
        error = authError?.message || 'Supaclank did not receive a signed-in session.';
        return;
      }
      location.replace(returnTo);
    } catch (cause) {
      error = cause?.message || String(cause);
    }
  });
</script>

<svelte:head><title>Finishing sign-in · Supaclank</title></svelte:head>

<div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12 text-center">
  <a href="/" class="mb-8 flex items-center justify-center gap-2.5"><img src="/mascot.png" alt="" width="40" height="40" class="rounded-xl" /><span class="text-lg font-semibold tracking-tight">supaclank</span></a>
  <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
    {#if error}
      <h1 class="text-xl font-semibold">Sign-in didn’t finish</h1>
      <p class="mt-2 text-sm text-danger">{error}</p>
      <a href="/signup" class="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white">Try again</a>
    {:else}
      <span class="mx-auto block h-3 w-3 animate-pulse rounded-full bg-brand"></span>
      <h1 class="mt-4 text-xl font-semibold">Finishing sign-in…</h1>
      <p class="mt-1 text-sm text-muted">Returning you to your preview.</p>
    {/if}
  </div>
</div>
