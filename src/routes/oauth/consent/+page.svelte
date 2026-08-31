<script>
  // This screen grants account access. It stays first-party, receives a strict
  // production CSP, and relies on Svelte escaping client names and scopes.
  import { onMount } from 'svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { GATEWAY_URL } from '$lib/config.js';
  import { firstPartyClientId, authorizationClientId } from '$lib/oauth-first-party.js';

  let view = $state('loading');
  let errorMsg = $state('');
  let clientName = $state('this app');
  let scopes = $state([]);
  let userLabel = $state('');
  let busy = $state(false);
  let supabase;
  let authId;

  onMount(async () => {
    try {
      const { createSupabase } = await import('$lib/supabase');
      supabase = createSupabase();
      authId = new URLSearchParams(location.search).get('authorization_id');
      if (!authId) return fail('missing authorization_id in URL');

      // Started early so it overlaps the getUser/getAuthorizationDetails
      // round-trips; awaited only at the first-party check below.
      const firstPartyId = firstPartyClientId(GATEWAY_URL);

      // 1. Require a signed-in user; bounce to login while preserving the request.
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        location.href = `/oauth/login?authorization_id=${encodeURIComponent(authId)}`;
        return;
      }
      userLabel = user.email || user.id;

      // 2. Fetch the authorization request details.
      if (
        !supabase.auth.oauth ||
        typeof supabase.auth.oauth.getAuthorizationDetails !== 'function'
      ) {
        return fail('this supabase-js build has no OAuth Server API');
      }
      const r = await supabase.auth.oauth.getAuthorizationDetails(authId);
      if (r.error) {
        trackEvent(analyticsEvents.oauthAuthorizationFailed, { stage: 'details' });

        // Supabase cannot re-associate an authorization created before sign-in.
        // The original PKCE request cannot be reconstructed here, so ask the app to retry.
        const msg = String(r.error.message || r.error).toLowerCase();
        if (msg.includes('not found') || msg.includes('expired')) {
          view = 'stale';
          return;
        }
        return fail(`couldn't fetch authorization details: ${r.error.message || r.error}`);
      }
      const details = r.data;

      // 3. First-party or previously approved clients can arrive already authorized.
      const autoRedirect = details?.redirect_url || details?.redirect_to;
      if (autoRedirect) {
        await trackEvent(analyticsEvents.oauthAuthorized, { approval: 'automatic' });
        location.href = autoRedirect;
        return;
      }

      // 4. Our own app skips the consent card: Clank is the sole
      //    first-party client of an OIDC server nobody else can register
      //    with, and users signing in to our own app shouldn't be asked
      //    to authorize it like a stranger. Approval is pinned to the
      //    client id the gateway advertises — on mismatch, gateway
      //    outage, or unset GATEWAY_URL we fall back to asking.
      const clientId = authorizationClientId(details);
      if (clientId && clientId === (await firstPartyId)) {
        await decide(true, 'first_party');
        return;
      }

      // 5. Otherwise render the consent UI. `client` is {id, name, ...}
      //    (supabase/auth ClientDetailsResponse) — reading `client_name`
      //    here previously always missed, showing "this app".
      clientName = details?.client?.name || 'this app';
      scopes = details?.scope?.split(' ').filter(Boolean) || [];
      view = 'consent';
    } catch (e) {
      fail(`unexpected: ${e?.message || e}`);
    }
  });

  function fail(msg) {
    errorMsg = msg;
    view = 'error';
    console.error('[oauth/consent]', msg);
  }

  async function decide(approved, approval = 'explicit') {
    busy = true;
    try {
      const r = approved
        ? await supabase.auth.oauth.approveAuthorization(authId)
        : await supabase.auth.oauth.denyAuthorization(authId);
      if (r.error) throw r.error;
      const redirect = r.data?.redirect_to || r.data?.redirect_url;
      if (!redirect) throw new Error("Supabase didn't return a redirect URL");
      if (approved) {
        await trackEvent(analyticsEvents.oauthAuthorized, { approval });
      }
      location.href = redirect;
    } catch (e) {
      trackEvent(analyticsEvents.oauthAuthorizationFailed, {
        decision: approved ? 'approve' : 'deny',
        stage: 'decision'
      });
      fail(`${approved ? 'approve' : 'deny'} failed: ${e.message || e}`);
      busy = false;
    }
  }
</script>

<svelte:head><title>Authorize · Supaclank</title></svelte:head>

<div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
  <a href="/" class="mb-8 flex items-center justify-center gap-2.5">
    <img src="/mascot.png" alt="" width="40" height="40" class="rounded-xl" />
    <span class="text-lg font-semibold tracking-tight">supaclank</span>
  </a>

  {#if view === 'loading'}
    <p class="text-center text-muted">Loading…</p>
  {:else if view === 'stale'}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
      <h1 class="text-xl font-semibold">You're signed in</h1>
      <p class="mt-2 text-sm text-muted">
        This sign-in link was opened before you had an account session, so it
        can no longer be completed. Go back to the app and tap Sign in once
        more. It will go straight through this time.
      </p>
    </div>
  {:else if view === 'error'}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
      <p class="text-sm text-danger">{errorMsg}</p>
    </div>
  {:else}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
      <h1 class="text-xl font-semibold">Authorize {clientName}</h1>
      <p class="mt-1 text-sm text-muted">
        This will let <strong class="text-ink">{clientName}</strong> sign in to your Supaclank account.
      </p>
      {#if scopes.length}
        <p class="mt-4 text-sm">It will be able to:</p>
        <ul class="mt-1.5 list-disc pl-5 text-sm text-muted">
          {#each scopes as s}<li>{s}</li>{/each}
        </ul>
      {/if}
      <div class="mt-6 flex gap-2.5">
        <button
          onclick={() => decide(false)}
          disabled={busy}
          class="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
          >Cancel</button
        >
        <button
          onclick={() => decide(true)}
          disabled={busy}
          class="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-muted disabled:opacity-50"
          >Allow</button
        >
      </div>
      <p class="mt-3 text-xs text-dim">
        Signed in as <code class="analytics-sensitive rounded bg-surface px-1.5 py-0.5 font-mono">{userLabel}</code>
      </p>
    </div>
  {/if}
</div>
