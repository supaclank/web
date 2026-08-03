<script>
  import { onMount } from 'svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { safeReturnTo } from '$lib/navigation.js';

  let supabase = $state(null);
  let mode = $state('signup'); // 'signup' | 'signin'
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let notice = $state('');
  let busy = $state(false);
  let returnTo = $state('/welcome');

  onMount(async () => {
    returnTo = safeReturnTo(new URLSearchParams(location.search).get('return_to'));
    const { createSupabase } = await import('$lib/supabase');
    supabase = createSupabase();

    // Already signed in: skip the account form and preserve the requested destination.
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) location.href = returnTo;
  });

  async function github() {
    error = '';
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: authCallbackURL() }
    });
    if (e) {
      if (mode === 'signup') trackEvent(analyticsEvents.signupFailed, { method: 'github' });
      error = e.message;
    }
  }

  async function submitEmail(e) {
    e.preventDefault();
    error = '';
    notice = '';
    busy = true;
    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: authCallbackURL() }
      });
      busy = false;
      if (err) {
        trackEvent(analyticsEvents.signupFailed, { method: 'email' });
        error = err.message;
        return;
      }
      if (data.session) {
        location.href = returnTo;
        return;
      }
      notice = 'Check your email to confirm your account, then you’re in.';
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      busy = false;
      if (err) {
        error = err.message;
        return;
      }
      location.href = returnTo;
    }
  }

  function authCallbackURL() {
    const callback = new URL('/auth/callback', location.origin);
    callback.searchParams.set('return_to', returnTo);
    return callback.toString();
  }
</script>

<svelte:head><title>{mode === 'signup' ? 'Get started' : 'Sign in'} · Supaclank</title></svelte:head>

<div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
  <a href="/" class="mb-8 flex items-center justify-center gap-2.5">
    <img src="/mascot.png" alt="" width="40" height="40" class="rounded-xl" />
    <span class="text-lg font-semibold tracking-tight">supaclank</span>
  </a>

  <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
    <h1 class="text-xl font-semibold">
      {mode === 'signup' ? 'Create your account' : 'Welcome back'}
    </h1>
    <p class="mt-1 text-sm text-muted">
      {mode === 'signup'
        ? 'Free and open source. Sign in to start building.'
        : 'Sign in to your account.'}
    </p>

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
        autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
        placeholder="Password"
        class="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={!supabase || busy}
        class="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
      >
        {mode === 'signup' ? 'Sign up with email' : 'Sign in with email'}
      </button>
    </form>

    {#if error}<p class="mt-3 text-sm text-danger">{error}</p>{/if}
    {#if notice}<p class="mt-3 text-sm text-success">{notice}</p>{/if}

    
    <!-- Keep consent beside both sign-up actions, before the user creates an account. -->
    {#if mode === 'signup'}
      <p class="mt-5 text-center text-xs text-dim">
        By creating an account you agree to our
        <a href="/terms" class="underline decoration-line underline-offset-2 transition-colors hover:text-muted"
          >Terms</a
        >
        and
        <a href="/privacy" class="underline decoration-line underline-offset-2 transition-colors hover:text-muted"
          >Privacy Policy</a
        >.
      </p>
    {/if}
  </div>

  <p class="mt-5 text-center text-sm text-muted">
    {#if mode === 'signup'}
      Already have an account?
      <button class="font-medium text-brand hover:underline" onclick={() => (mode = 'signin')}
        >Sign in</button
      >
    {:else}
      New here?
      <button class="font-medium text-brand hover:underline" onclick={() => (mode = 'signup')}
        >Get started</button
      >
    {/if}
  </p>
</div>
