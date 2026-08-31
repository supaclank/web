<script>
  import { onDestroy, onMount } from 'svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { safeReturnTo } from '$lib/navigation.js';

  let supabase = $state(null);
  let mode = $state('signup'); // 'signup' | 'signin'
  let view = $state('form'); // 'form' | 'confirm'
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let notice = $state('');
  let busy = $state(false);
  let returnTo = $state('/welcome');
  let resendCooldown = $state(0);
  let authSubscription = null;

  onMount(async () => {
    returnTo = safeReturnTo(new URLSearchParams(location.search).get('return_to'));
    const { createSupabase } = await import('$lib/supabase');
    supabase = createSupabase();

    // Already signed in: skip the account form and preserve the requested destination.
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) location.href = returnTo;

    // Confirming the email in another tab of this browser signs this tab in
    // too; move on the moment that happens.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (view === 'confirm' && session) location.href = returnTo;
    });
    authSubscription = data.subscription;
  });

  onDestroy(() => authSubscription?.unsubscribe());

  // The auth-state listener above misses sessions written before it attached,
  // so poll while waiting; getSession re-reads storage on every call.
  $effect(() => {
    if (view !== 'confirm' || !supabase) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) location.href = returnTo;
    }, 2500);
    return () => clearInterval(interval);
  });

  $effect(() => {
    if (view !== 'confirm' || resendCooldown <= 0) return;
    const timer = setTimeout(() => (resendCooldown -= 1), 1000);
    return () => clearTimeout(timer);
  });

  // cooldown matches Supabase's send rate limit when an email just went out;
  // pass 0 when none was sent (e.g. an unconfirmed sign-in) so resending is
  // immediately available.
  function enterConfirmView(cooldown = 60) {
    view = 'confirm';
    resendCooldown = cooldown;
    error = '';
    notice = '';
  }

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
      if (err) {
        busy = false;
        trackEvent(analyticsEvents.signupFailed, { method: 'email' });
        error = err.message;
        return;
      }
      if (data.session) {
        location.href = returnTo;
        return;
      }
      // Existing accounts come back as a user with no identities (the body is
      // shaped to prevent email enumeration). The password we hold is most
      // likely theirs, so try it before bouncing them to the sign-in form.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        const { error: signinErr } = await supabase.auth.signInWithPassword({ email, password });
        busy = false;
        if (!signinErr) {
          location.href = returnTo;
          return;
        }
        if (isUnconfirmedError(signinErr)) {
          enterConfirmView(0);
          return;
        }
        mode = 'signin';
        notice = 'That email already has an account. Enter your password to sign in.';
        return;
      }
      busy = false;
      enterConfirmView();
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      busy = false;
      if (err) {
        if (isUnconfirmedError(err)) {
          enterConfirmView(0);
          return;
        }
        error = err.message;
        return;
      }
      location.href = returnTo;
    }
  }

  async function forgotPassword() {
    error = '';
    notice = '';
    if (!email) {
      error = 'Enter your email above and we’ll send you a reset link.';
      return;
    }
    busy = true;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset`
    });
    busy = false;
    if (err) {
      error = err.message;
      return;
    }
    notice = 'Check your email for a link to reset your password.';
  }

  // Confirmation can happen in this browser (session already synced here) or
  // on another device (sign in with the credentials we hold).
  async function confirmAndContinue() {
    busy = true;
    error = '';
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      location.href = returnTo;
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    busy = false;
    if (!err) {
      location.href = returnTo;
      return;
    }
    error = isUnconfirmedError(err)
      ? 'Not confirmed yet — open the link in the email we sent, then try again.'
      : err.message;
  }

  async function resend() {
    if (busy || resendCooldown > 0) return;
    busy = true;
    error = '';
    notice = '';
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: authCallbackURL() }
    });
    busy = false;
    if (err) {
      error = err.message;
      return;
    }
    resendCooldown = 60;
    notice = 'Confirmation email sent again.';
  }

  function editEmail() {
    view = 'form';
    mode = 'signup';
    error = '';
    notice = '';
  }

  function isUnconfirmedError(err) {
    return /email.*not.*confirmed/i.test(err?.message || '');
  }

  function authCallbackURL() {
    const callback = new URL('/auth/callback', location.origin);
    callback.searchParams.set('return_to', returnTo);
    return callback.toString();
  }
</script>

<svelte:head
  ><title
    >{view === 'confirm' ? 'Confirm your email' : mode === 'signup' ? 'Get started' : 'Sign in'} · Supaclank</title
  ></svelte:head
>

<div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
  <a href="/" class="mb-8 flex items-center justify-center gap-2.5">
    <img src="/mascot.png" alt="" width="40" height="40" class="rounded-xl" />
    <span class="text-lg font-semibold tracking-tight">supaclank</span>
  </a>

  {#if view === 'confirm'}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-brand"></span>
        <h1 class="text-xl font-semibold">Confirm your email</h1>
      </div>
      <p class="mt-2 text-sm text-muted">
        We sent a confirmation link to <strong class="analytics-sensitive font-medium text-ink">{email}</strong>. Open
        it and this page continues by itself.
      </p>

      <button
        onclick={confirmAndContinue}
        disabled={busy}
        class="mt-5 w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-muted disabled:opacity-50"
      >
        I’ve confirmed — continue
      </button>
      <button
        onclick={resend}
        disabled={busy || resendCooldown > 0}
        class="mt-2.5 w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
      >
        {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend email'}
      </button>

      {#if error}<p class="mt-3 text-sm text-danger">{error}</p>{/if}
      {#if notice}<p class="mt-3 text-sm text-success">{notice}</p>{/if}

      <p class="mt-5 text-center text-xs text-dim">
        Wrong address or no email after a minute? Check spam, or
        <button class="underline decoration-line underline-offset-2 hover:text-muted" onclick={editEmail}
          >use a different email</button
        >.
      </p>
    </div>
  {:else}
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
        <span class="h-px flex-1 bg-line-subtle"></span>or<span class="h-px flex-1 bg-line-subtle"
        ></span>
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

      {#if mode === 'signin'}
        <p class="mt-3 text-center text-sm">
          <button
            class="text-muted transition-colors hover:text-ink"
            disabled={!supabase || busy}
            onclick={forgotPassword}>Forgot your password?</button
          >
        </p>
      {/if}

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
  {/if}

  {#if view !== 'confirm'}
    <p class="mt-5 text-center text-sm text-muted">
      {#if mode === 'signup'}
        Already have an account?
        <button class="font-medium text-brand hover:underline" onclick={() => (mode = 'signin')}
          >Sign in</button
        >
      {:else}
        New here?
        <button class="font-medium text-brand hover:underline" onclick={() => (mode = 'signup')}
          >Sign up</button
        >
      {/if}
    </p>
  {/if}
</div>
