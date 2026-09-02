<script>
  // Account setup and cloud billing after sign-in.
  import { onMount } from 'svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { safeReturnTo } from '$lib/navigation.js';
  import { CLOUD_MONTHLY_PLAN } from '$lib/pricing.js';
  import WelcomeSetup from '$lib/onboarding/WelcomeSetup.svelte';
  import { USAGE, preferencesFromUser } from '$lib/onboarding/preferences.js';

  let phase = $state('loading');
  let confirmMsg = $state(null);
  let status = $state(null);
  let email = $state('');
  let busy = $state(false);
  let confirming = $state(false);
  let error = $state('');
  let supabase = $state(null);
  let gatewayURL = '';
  let token = '';
  let returnTo = $state('/welcome');
  let onboardingPreferences = $state(null);

  const confirmMessages = {
    signup: { title: 'Email confirmed', body: 'Your account is active and your free trial has started.' },
    recovery: { title: 'Reset link valid', body: 'You can set a new password from your account.' },
    invite: { title: 'Invitation accepted', body: 'Welcome to Supaclank.' },
    magiclink: { title: 'Signed in', body: 'You’re all set.' },
    email_change: { title: 'Email updated', body: 'Your new email is active.' }
  };

  onMount(async () => {
    const requestedReturnTo = new URLSearchParams(location.search).get('return_to');
    returnTo = safeReturnTo(requestedReturnTo || checkoutReturnTo());
    const hash = location.hash || '';

    // Supabase confirmation tokens arrive in the fragment; consume their type and
    // remove the credentials from browser history immediately.
    if (hash.includes('access_token=')) {
      const type = new URLSearchParams(hash.slice(1)).get('type') || '';
      confirmMsg = Object.hasOwn(confirmMessages, type) ? confirmMessages[type] : { title: 'Signed in', body: 'You’re all set.' };
      history.replaceState(null, '', location.pathname);
    }

    const [{ createSupabase }, { GATEWAY_URL }] = await Promise.all([
      import('$lib/supabase'),
      import('$lib/config')
    ]);
    gatewayURL = GATEWAY_URL;
    supabase = createSupabase();

    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      phase = 'signedout';
      return;
    }
    token = session.access_token;
    email = session.user.email || '';
    // Read preferences from the session we already have so a local-only user
    // is known before touching billing, which lazily creates a trial row.
    onboardingPreferences = preferencesFromUser(session.user);
    const isLocalOnly = onboardingPreferences?.usage === USAGE.local;
    if (!isLocalOnly) await loadStatus();
    phase = 'ready';

    if (!isLocalOnly) {
      // Stripe redirects here the instant checkout completes, but the
      // subscription only becomes active once the customer.subscription.*
      // webhook reaches clankgw. That race is normally a second or two, and
      // losing it used to leave a paying customer staring at "Subscribe",
      // corrected only if they happened to reload. Poll while the
      // checkout marker is set, so the page settles by itself.
      if (checkoutWasStarted() && status?.status !== 'active') {
        confirming = true;
        await pollUntilActive();
        confirming = false;
      }
      await recordBillingConversions();
    }
  });

  // ~30s of polling, backing off 1s to 3s. Generous enough for a slow
  // webhook, bounded so a genuinely failed payment cannot spin forever;
  // it just falls back to whatever status we last read.
  async function pollUntilActive() {
    const delays = [1000, 1000, 1500, 1500, 2000, 2000, 3000, 3000, 3000, 3000, 3000, 3000];
    for (const ms of delays) {
      await new Promise((r) => setTimeout(r, ms));
      await loadStatus();
      if (status?.status === 'active') {
        clearCheckoutStarted();
        return;
      }
    }
  }

  async function loadStatus() {
    try {
      const res = await fetch(`${gatewayURL}/v1/billing/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) status = await res.json();
    } catch {
      // Non-fatal: the page still renders without billing status.
    }
  }

  async function subscribe() {
    busy = true;
    error = '';
    try {
      const res = await fetch(`${gatewayURL}/v1/billing/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => null);
      if (data?.checkout_url) {
        markCheckoutStarted();
        rememberCheckoutReturnTo();
        await trackEvent(analyticsEvents.checkoutStarted, { plan: 'cloud-monthly' });
        location.href = data.checkout_url;
        return;
      }
      trackEvent(analyticsEvents.checkoutFailed, { stage: 'create-session' });
      error = data?.error || 'Could not start checkout.';
    } catch (e) {
      trackEvent(analyticsEvents.checkoutFailed, { stage: 'network' });
      error = String(e);
    }
    busy = false;
  }

  async function recordBillingConversions() {
    // A trial row is created lazily by the status endpoint. Only treat a
    // very recent timestamp as a new conversion, then dedupe anonymously
    // in this browser so refreshes cannot inflate it.
    if (status?.status === 'trialing' && status.trial_started_at) {
      const startedAt = Date.parse(status.trial_started_at);
      const age = Date.now() - startedAt;
      if (Number.isFinite(startedAt) && age >= -60 * 1000 && age < 5 * 60 * 1000) {
        await trackOnce(
          `supaclank:trial-started:${status.trial_started_at}`,
          analyticsEvents.trialStarted,
          { plan: 'cloud-trial' }
        );
      }
    }
    // Stripe returns to this tab. Keep the marker until the webhook-backed
    // status is active, so a refresh after a short webhook race can retry.
    if (
      status?.status === 'active' &&
      checkoutWasStarted()
    ) {
      const tracked = await trackEvent(analyticsEvents.subscriptionActivated, {
        plan: 'cloud-monthly'
      });
      if (tracked) clearCheckoutStarted();
    }
  }

  function markCheckoutStarted() {
    try {
      sessionStorage.setItem('supaclank:checkout-started', '1');
    } catch {
      // Private browsing can disable storage; checkout still proceeds.
    }
  }

  function checkoutWasStarted() {
    try {
      return sessionStorage.getItem('supaclank:checkout-started') === '1';
    } catch {
      return false;
    }
  }

  function clearCheckoutStarted() {
    try {
      sessionStorage.removeItem('supaclank:checkout-started');
    } catch {
      // Best effort only.
    }
  }

  function rememberCheckoutReturnTo() {
    if (returnTo === '/welcome') return;
    try {
      sessionStorage.setItem('supaclank:checkout-return-to', returnTo);
    } catch {
      // The billing flow still works when private browsing disables storage.
    }
  }

  function checkoutReturnTo() {
    try {
      return sessionStorage.getItem('supaclank:checkout-return-to') || '';
    } catch {
      return '';
    }
  }

  function clearCheckoutReturnTo() {
    try {
      sessionStorage.removeItem('supaclank:checkout-return-to');
    } catch {
      // Best effort after navigation.
    }
  }

  async function trackOnce(key, event, props) {
    try {
      if (localStorage.getItem(key)) return;
      const tracked = await trackEvent(event, props);
      if (tracked) localStorage.setItem(key, '1');
    } catch {
      // Storage can be disabled; analytics must never affect the app.
      await trackEvent(event, props);
    }
  }

  async function manage() {
    busy = true;
    error = '';
    try {
      const res = await fetch(`${gatewayURL}/v1/billing/portal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => null);
      if (data?.portal_url) {
        location.href = data.portal_url;
        return;
      }
      error = data?.error || 'No subscription to manage yet.';
    } catch (e) {
      error = String(e);
    }
    busy = false;
  }

  async function signOut() {
    await supabase?.auth.signOut();
    location.href = '/';
  }
  let trialing = $derived(status?.status === 'trialing');
  // Headline + CTA derived from billing status.
  let active = $derived(status?.status === 'active');
  let needsPay = $derived(status && !status.allowed);
</script>

<svelte:head><title>Welcome · Supaclank</title></svelte:head>

<div class="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
  <a href="/" class="mb-8 flex items-center justify-center gap-2.5">
    <img src="/mascot.png" alt="" width="40" height="40" class="rounded-xl" />
    <span class="text-lg font-semibold tracking-tight">supaclank</span>
  </a>

  {#if phase === 'loading'}
    <p class="text-center text-muted">Loading…</p>
  {:else if phase === 'signedout'}
    <div class="rounded-2xl border border-line bg-elevated p-6 text-center shadow-sm">
      <h1 class="text-xl font-semibold">You're signed out</h1>
      <p class="mt-1 text-sm text-muted">Sign in to see your account.</p>
      <a
        href="/signup?mode=signin"
        class="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-muted"
        >Sign in</a
      >
    </div>
  {:else}
    {#if confirmMsg}
      <div class="mb-4 rounded-xl border border-success/30 bg-success/10 p-4">
        <p class="text-sm font-medium text-success">{confirmMsg.title}</p>
        <p class="mt-0.5 text-sm text-muted">{confirmMsg.body}</p>
      </div>
    {/if}

    <WelcomeSetup {supabase} onpreferences={(value) => onboardingPreferences = value} />

    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
      <h1 class="text-xl font-semibold">Your account</h1>
      {#if email}<p class="mt-1 text-sm text-muted">Signed in as {email}</p>{/if}

      <details class="mt-4" open={onboardingPreferences?.usage !== USAGE.local || active || returnTo !== '/welcome'}>
        <summary class="cursor-pointer text-sm font-medium text-muted">Cloud account &amp; billing</summary>
        <!-- Billing status -->
        <div class="mt-5 rounded-xl bg-surface p-4">
          {#if confirming && !active}
            <p class="text-sm font-medium">Confirming your subscription…</p>
            <p class="mt-0.5 text-sm text-muted">
              Payment went through. This updates by itself in a moment.
            </p>
          {:else if !status}
            <p class="text-sm text-muted">Could not load billing status.</p>
          {:else if active}
            <p class="text-sm font-medium text-success">Pro plan active</p>
            <p class="mt-0.5 text-sm text-muted">Thanks for subscribing.</p>
            <button
              onclick={manage}
              disabled={busy}
              class="mt-3 rounded-lg border border-line bg-elevated px-4 py-2 text-sm font-medium hover:bg-paper disabled:opacity-50"
              >Manage subscription</button
            >
          {:else if trialing && !needsPay}
            <p class="text-sm font-medium">
              {status.days_left}
              {status.days_left === 1 ? 'day' : 'days'} left of your free trial
            </p>
            <p class="mt-0.5 text-sm text-muted">Enjoy Pro on us. Subscribe anytime to keep going.</p>
            <button
              onclick={subscribe}
              disabled={busy}
              class="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-muted disabled:opacity-50"
              >{CLOUD_MONTHLY_PLAN.checkoutLabel}</button
            >
          {:else}
            <p class="text-sm font-medium text-danger">Your trial has ended</p>
            <p class="mt-0.5 text-sm text-muted">Subscribe to keep using the cloud.</p>
            <button
              onclick={subscribe}
              disabled={busy}
              class="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-muted disabled:opacity-50"
              >{CLOUD_MONTHLY_PLAN.checkoutLabel}</button
            >
          {/if}
          <!-- Consent point for the paid contract. Shown only when a Subscribe
               button is on screen, i.e. not on the manage-subscription branch. -->
          {#if status && !active && !confirming}
            <p class="mt-2.5 text-xs text-dim">
              Subscribing means accepting our
              <a href="/terms" class="underline decoration-line underline-offset-2 transition-colors hover:text-muted"
                >Terms</a
              >, including the cancellation and refund terms.
            </p>
          {/if}
          {#if error}<p class="mt-2 text-sm text-danger">{error}</p>{/if}
        </div>

        {#if status?.allowed && returnTo !== '/welcome'}
          <a href={returnTo} onclick={clearCheckoutReturnTo} class="mt-4 block rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-muted">Continue to your preview</a>
        {/if}
      </details>
    </div>

    <button onclick={signOut} class="mt-5 text-center text-sm text-muted hover:text-ink">Sign out</button>
  {/if}
</div>
