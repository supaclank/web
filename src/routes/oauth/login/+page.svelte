<script>
  // Sign in before approving an app authorization. authorization_id survives
  // the round trip so the consent screen can resume the same request.
  import { onMount } from 'svelte';

  let supabase = $state(null);
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  // Return to consent when this started as OAuth; otherwise use the normal funnel.
  let consentURL = '/welcome';

  onMount(async () => {
    const { createSupabase } = await import('$lib/supabase');
    supabase = createSupabase();
    const authId = new URLSearchParams(location.search).get('authorization_id');
    consentURL = authId ? `/oauth/consent?authorization_id=${encodeURIComponent(authId)}` : '/welcome';
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) location.href = consentURL;
  });

  async function github() {
    error = '';
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}${consentURL}` }
    });
    if (e) error = e.message;
  }

  async function submitEmail(e) {
    e.preventDefault();
    error = '';
    busy = true;
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    busy = false;
    if (err) {
      error = err.message;
      return;
    }
    location.href = consentURL;
  }
</script>

<svelte:head><title>Sign in · Supaclank</title></svelte:head>

<div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
  <a href="/" class="mb-8 flex items-center justify-center gap-2.5">
    <img src="/mascot.png" alt="" width="40" height="40" class="rounded-xl" />
    <span class="text-lg font-semibold tracking-tight">supaclank</span>
  </a>
  <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
    <h1 class="text-xl font-semibold">Sign in to Supaclank</h1>
    <p class="mt-1 text-sm text-muted">Sign in to approve the CLI / app authorization.</p>

    <button
      onclick={github}
      disabled={!supabase || busy}
      class="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg bg-ink px-4 py-2.5 font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
        ><path
          d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z"
        /></svg
      >
      Continue with GitHub
    </button>

    <div class="my-4 flex items-center gap-3 text-xs text-dim">
      <span class="h-px flex-1 bg-line-subtle"></span>or<span class="h-px flex-1 bg-line-subtle"></span>
    </div>

    <form onsubmit={submitEmail} class="space-y-3">
      <input
        type="email"
        bind:value={email}
        required
        autocomplete="email"
        placeholder="you@example.com"
        class="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
      <input
        type="password"
        bind:value={password}
        required
        autocomplete="current-password"
        placeholder="Password"
        class="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={!supabase || busy}
        class="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
      >
        Sign in with email
      </button>
    </form>

    {#if error}<p class="mt-3 text-sm text-danger">{error}</p>{/if}
  </div>
</div>
