<script>
  import { onMount } from 'svelte';
  import PreviewShelf from '$lib/workshop/PreviewShelf.svelte';
  import Sidebar from '$lib/workshop/Sidebar.svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { safeReturnTo, repositoryPath } from '$lib/navigation.js';
  import { PLAY_STORE_URL } from '$lib/demo/tutorial.js';
  import { ClankGateway } from '$lib/clank-gateway.js';
  import { githubRepositoryFrom } from '$lib/workshop.js';

  const PAGE_LOADING = 'loading';
  const PAGE_SIGNED_OUT = 'signedout';
  const PAGE_READY = 'ready';
  const PREVIEWS_LOADING = 'loading';
  const PREVIEWS_READY = 'ready';
  const WORKSHOP_FIXTURE_QUERY = 'workshop_fixture';
  const WORKSHOP_FIXTURE_POPULATED = 'populated';

  let phase = $state(PAGE_LOADING);
  let previewPhase = $state(PREVIEWS_LOADING);
  let previews = $state([]);
  let previewError = $state('');
  let openingToken = $state('');
  let repoInput = $state('');
  let repoError = $state('');
  let confirmMsg = $state(null);
  let status = $state(null);
  let email = $state('');
  let busy = $state(false);
  let confirming = $state(false);
  let error = $state('');
  let supabase;
  let gateway;
  let gatewayURL = '';
  let token = '';
  let returnTo = $state('/welcome');

  const confirmMessages = {
    signup: { title: 'Email confirmed', body: 'Your workshop is ready.' },
    recovery: { title: 'Reset link valid', body: 'You can set a new password from your account.' },
    invite: { title: 'Invitation accepted', body: 'Welcome to Supaclank.' },
    magiclink: { title: 'Signed in', body: 'Welcome back to your workshop.' },
    email_change: { title: 'Email updated', body: 'Your new email is active.' }
  };

  onMount(async () => {
    if (loadDevelopmentFixture()) return;
    const requestedReturnTo = new URLSearchParams(location.search).get('return_to');
    returnTo = safeReturnTo(requestedReturnTo || checkoutReturnTo());
    consumeConfirmation();

    const [{ createSupabase }, { GATEWAY_URL }] = await Promise.all([
      import('$lib/supabase'),
      import('$lib/config')
    ]);
    gatewayURL = GATEWAY_URL;
    supabase = createSupabase();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      phase = PAGE_SIGNED_OUT;
      return;
    }

    token = session.access_token;
    email = session.user.email || '';
    gateway = new ClankGateway(gatewayURL, token);
    phase = PAGE_READY;

    await Promise.all([loadPreviews(), loadStatus()]);
    if (checkoutWasStarted() && status?.status !== 'active') {
      confirming = true;
      await pollUntilActive();
      confirming = false;
    }
    await recordBillingConversions();
  });

  function loadDevelopmentFixture() {
    if (!import.meta.env.DEV) return false;
    const fixture = new URLSearchParams(location.search).get(WORKSHOP_FIXTURE_QUERY);
    if (!fixture) return false;

    email = 'maker@example.com';
    status = { status: 'trialing', allowed: true, days_left: 13 };
    previews = fixture === WORKSHOP_FIXTURE_POPULATED
      ? [
          { token: 'preview-one', worktree_id: 'wt-supaclank-web', service_name: 'supaclank-web', created_at: new Date(Date.now() - 11 * 60_000).toISOString() },
          { token: 'preview-two', worktree_id: 'wt-habit-garden', service_name: 'habit-garden', created_at: new Date(Date.now() - 3 * 60 * 60_000).toISOString() },
          { token: 'preview-three', worktree_id: 'wt-web-preview', service_name: 'default', created_at: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString() }
        ]
      : [];
    phase = PAGE_READY;
    previewPhase = PREVIEWS_READY;
    return true;
  }

  function consumeConfirmation() {
    const hash = location.hash || '';
    if (!hash.includes('access_token=')) return;
    const type = new URLSearchParams(hash.slice(1)).get('type') || '';
    confirmMsg = Object.hasOwn(confirmMessages, type)
      ? confirmMessages[type]
      : { title: 'Signed in', body: 'Your workshop is ready.' };
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  }

  async function loadPreviews() {
    previewError = '';
    try {
      previews = await gateway.previews();
    } catch (cause) {
      previewError = cause?.message || String(cause);
    }
    previewPhase = PREVIEWS_READY;
  }

  function openRepository(event) {
    event.preventDefault();
    repoError = '';
    try {
      const { owner, repo } = githubRepositoryFrom(repoInput);
      location.href = repositoryPath(owner, repo);
    } catch (cause) {
      repoError = cause?.message || String(cause);
    }
  }

  async function openPreview(preview) {
    openingToken = preview.token;
    previewError = '';
    try {
      const signed = await gateway.signPreviewForBrowser(preview.token);
      if (!signed?.signed_url) throw new Error('The gateway returned an empty preview URL.');
      location.href = signed.signed_url;
    } catch (cause) {
      previewError = cause?.message || String(cause);
      openingToken = '';
    }
  }

  async function pollUntilActive() {
    const delays = [1000, 1000, 1500, 1500, 2000, 2000, 3000, 3000, 3000, 3000, 3000, 3000];
    for (const ms of delays) {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await loadStatus();
      if (status?.status === 'active') {
        clearCheckoutStarted();
        return;
      }
    }
  }

  async function loadStatus() {
    try {
      const response = await fetch(`${gatewayURL}/v1/billing/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) status = await response.json();
    } catch {
      // Billing is secondary to the workshop; the rest of the page stays usable.
    }
  }

  async function subscribe() {
    busy = true;
    error = '';
    try {
      const response = await fetch(`${gatewayURL}/v1/billing/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => null);
      if (data?.checkout_url) {
        markCheckoutStarted();
        rememberCheckoutReturnTo();
        await trackEvent(analyticsEvents.checkoutStarted, { plan: 'cloud-monthly' });
        location.href = data.checkout_url;
        return;
      }
      trackEvent(analyticsEvents.checkoutFailed, { stage: 'create-session' });
      error = data?.error || 'Could not start checkout.';
    } catch (cause) {
      trackEvent(analyticsEvents.checkoutFailed, { stage: 'network' });
      error = String(cause);
    }
    busy = false;
  }

  async function manage() {
    busy = true;
    error = '';
    try {
      const response = await fetch(`${gatewayURL}/v1/billing/portal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => null);
      if (data?.portal_url) {
        location.href = data.portal_url;
        return;
      }
      error = data?.error || 'No subscription to manage yet.';
    } catch (cause) {
      error = String(cause);
    }
    busy = false;
  }

  async function recordBillingConversions() {
    if (status?.status === 'trialing' && status.trial_started_at) {
      const startedAt = Date.parse(status.trial_started_at);
      const age = Date.now() - startedAt;
      if (Number.isFinite(startedAt) && age >= -60 * 1000 && age < 5 * 60 * 1000) {
        await trackOnce(`supaclank:trial-started:${status.trial_started_at}`, analyticsEvents.trialStarted, { plan: 'cloud-trial' });
      }
    }
    if (status?.status === 'active' && checkoutWasStarted()) {
      const tracked = await trackEvent(analyticsEvents.subscriptionActivated, { plan: 'cloud-monthly' });
      if (tracked) clearCheckoutStarted();
    }
  }

  function markCheckoutStarted() { try { sessionStorage.setItem('supaclank:checkout-started', '1'); } catch {} }
  function checkoutWasStarted() { try { return sessionStorage.getItem('supaclank:checkout-started') === '1'; } catch { return false; } }
  function clearCheckoutStarted() { try { sessionStorage.removeItem('supaclank:checkout-started'); } catch {} }
  function rememberCheckoutReturnTo() { if (returnTo !== '/welcome') try { sessionStorage.setItem('supaclank:checkout-return-to', returnTo); } catch {} }
  function checkoutReturnTo() { try { return sessionStorage.getItem('supaclank:checkout-return-to') || ''; } catch { return ''; } }
  function clearCheckoutReturnTo() { try { sessionStorage.removeItem('supaclank:checkout-return-to'); } catch {} }

  async function trackOnce(key, event, props) {
    try {
      if (localStorage.getItem(key)) return;
      const tracked = await trackEvent(event, props);
      if (tracked) localStorage.setItem(key, '1');
    } catch {
      await trackEvent(event, props);
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    location.href = '/';
  }

  let active = $derived(status?.status === 'active');
  let trialing = $derived(status?.status === 'trialing');
  let needsPay = $derived(status && !status.allowed);
  let planLabel = $derived(active ? 'Pro' : trialing && !needsPay ? `${status.days_left}d left` : needsPay ? 'Trial ended' : 'Account');
  let userName = $derived(email.split('@')[0] || 'maker');
</script>

<svelte:head>
  <title>Workshop · Supaclank</title>
  <meta name="description" content="Create and reopen private web and mobile app previews in Supaclank." />
</svelte:head>

{#if phase === PAGE_LOADING}
  <main class="center-state"><img src="/mascot.png" alt="" width="48" height="48" /><p>Opening your workshop…</p></main>
{:else if phase === PAGE_SIGNED_OUT}
  <main class="center-state"><img src="/mascot.png" alt="" width="48" height="48" /><h1>You’re signed out</h1><p>Sign in to return to your workshop.</p><a href="/signup">Sign in</a></main>
{:else}
  <div class="dashboard-shell">
    <Sidebar
      {email}
      {planLabel}
      previewCount={previews.length}
      {needsPay}
      {active}
      {busy}
      {error}
      onsubscribe={subscribe}
      onmanage={manage}
      onsignout={signOut}
    />

    <div class="workspace">
      <header class="mobile-header"><a href="/welcome"><img src="/mascot.png" alt="" width="30" height="30" /><span>supaclank</span></a><span>{planLabel}</span></header>

      <main id="dashboard" class="dashboard-main">
        <header class="page-heading">
          <div><p>Personal workspace</p><h1>Workshop</h1><span>Welcome back, {userName}. Pick up where you left off or start something new.</span></div>
          <div class="heading-actions"><a href="#web-builder" class="primary">＋ New web preview</a><a href={PLAY_STORE_URL} target="_blank" rel="noreferrer">Open mobile app ↗</a></div>
        </header>

        {#if confirmMsg}<div class="notice success"><div><b>{confirmMsg.title}</b><span>{confirmMsg.body}</span></div></div>{/if}
        {#if confirming && !active}<div class="notice"><div><b>Confirming your subscription…</b><span>This updates by itself in a moment.</span></div></div>{/if}
        {#if needsPay}<div class="notice billing"><div><b>Your workshop is paused</b><span>Everything is still here. Renew when you’re ready to wake it up again.</span></div><button type="button" onclick={subscribe} disabled={busy}>Renew access</button></div>{/if}
        {#if status?.allowed && returnTo !== '/welcome'}<div class="notice return"><div><b>Your preview is ready</b><span>Pick up exactly where you left off.</span></div><a href={returnTo} onclick={clearCheckoutReturnTo}>Continue →</a></div>{/if}

        <section class="overview" aria-label="Workspace overview">
          <article><div class="metric-icon previews">▣</div><div><span>Live previews</span><b>{previews.length}</b><small>Available without waking your machine</small></div></article>
          <article><div class="metric-icon machine">⌁</div><div><span>Cloud workshop</span><b>On demand</b><small>Wakes automatically when you open work</small></div></article>
          <article><div class="metric-icon plan">✦</div><div><span>Current plan</span><b>{active ? 'Pro' : trialing ? 'Free trial' : 'Account'}</b><small>{planLabel}</small></div></article>
        </section>

        <PreviewShelf phase={previewPhase} {previews} error={previewError} {openingToken} onopen={openPreview} />

        <section id="create" class="create-section" aria-labelledby="create-heading">
          <header><div><p>Create</p><h2 id="create-heading">Start something new</h2></div><span>Choose the workflow, not the platform.</span></header>

          <div class="create-grid">
            <article id="web-builder" class="create-card web-card">
              <div class="create-card-heading"><span class="builder-icon web">⌘</span><div><p>WEB WORKSPACE</p><h3>Open a GitHub project</h3></div><span class="environment browser">Runs in browser</span></div>
              <p class="description">For websites and browser apps. We create a private branch, start its dev server, and open the live editing overlay here.</p>
              <form class="repo-form" onsubmit={openRepository}>
                <label for="repo">Repository</label>
                <div><span>github.com/</span><input id="repo" bind:value={repoInput} placeholder="owner/repository" autocomplete="off" spellcheck="false" /><button type="submit">Open project <i>→</i></button></div>
                {#if repoError}<small role="alert">{repoError}</small>{/if}
              </form>
              <footer><span>Private worktree</span><span>Web preview</span><span>Point-and-edit overlay</span></footer>
            </article>

            <article class="create-card mobile-card">
              <div class="create-card-heading"><span class="builder-icon mobile">▯</span><div><p>MOBILE BUILDER</p><h3>Start a new native app</h3></div><span class="environment native">Native app required</span></div>
              <p class="description">For Android and iOS apps. Start from the Expo template, describe the first version, then edit it directly from your phone.</p>
              <div class="template-row"><div class="template-preview"><span></span><i></i></div><div><span>AVAILABLE TEMPLATE</span><b>Expo 56 starter</b><small>Blank native app · Agent-ready</small></div><em>Ready</em></div>
              <a class="mobile-action" href={PLAY_STORE_URL} target="_blank" rel="noreferrer"><span><small>CONTINUE IN CLANK</small>Open the Android app</span><i>↗</i></a>
              <footer><span>New app from scratch</span><a href="/demo">Not ready? Try the demo →</a></footer>
            </article>
          </div>
        </section>
      </main>
    </div>
  </div>
{/if}

<style>
  :global(body) { background: #f5f3ee; }
  .dashboard-shell { min-height: 100vh; color: var(--color-ink); }.workspace { min-height: 100vh; margin-left: 244px; }.dashboard-main { width: min(calc(100% - 54px), 1180px); margin: 0 auto; padding: 38px 0 72px; }
  .page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 27px; }.page-heading p, .create-section > header p { margin: 0 0 6px; color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }.page-heading h1 { margin: 0; font-size: 29px; font-weight: 630; letter-spacing: -.04em; }.page-heading > div:first-child > span { display: block; margin-top: 7px; color: var(--color-muted); font-size: 11px; }.heading-actions { display: flex; gap: 8px; }.heading-actions a { border: 1px solid var(--color-line); border-radius: 8px; padding: 9px 11px; background: #fff; color: var(--color-ink); font-size: 9px; font-weight: 600; text-decoration: none; }.heading-actions a.primary { border-color: var(--color-brand); background: var(--color-brand); color: #fff; }
  .overview { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; margin-bottom: 14px; }.overview article { display: flex; min-height: 86px; align-items: center; gap: 12px; border: 1px solid var(--color-line); border-radius: 12px; padding: 14px; background: #fff; }.metric-icon { display: grid; width: 37px; height: 37px; flex: none; place-items: center; border-radius: 9px; font-size: 15px; }.metric-icon.previews { background: #ffe8ed; color: var(--color-brand-muted); }.metric-icon.machine { background: #eaf6f1; color: #24785d; }.metric-icon.plan { background: #eeeae4; color: #514b45; }.overview article > div:last-child { min-width: 0; }.overview span, .overview b, .overview small { display: block; }.overview span { color: var(--color-dim); font-size: 8px; }.overview b { margin-top: 2px; font-size: 13px; font-weight: 620; }.overview small { overflow: hidden; margin-top: 4px; color: var(--color-muted); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
  .create-section { margin-top: 28px; scroll-margin-top: 20px; }.create-section > header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 13px; }.create-section h2 { margin: 0; font-size: 18px; font-weight: 620; letter-spacing: -.025em; }.create-section > header > span { color: var(--color-dim); font-size: 9px; }.create-grid { display: grid; grid-template-columns: minmax(0,1.12fr) minmax(330px,.88fr); gap: 13px; }.create-card { scroll-margin-top: 20px; overflow: hidden; border: 1px solid var(--color-line); border-radius: 14px; background: #fff; }.create-card-heading { display: flex; align-items: center; gap: 10px; padding: 16px 17px 11px; }.builder-icon { display: grid; width: 34px; height: 34px; flex: none; place-items: center; border-radius: 8px; font-size: 13px; }.builder-icon.web { background: #ffe5ea; color: var(--color-brand-muted); }.builder-icon.mobile { background: #302b27; color: #fff; }.create-card-heading > div { min-width: 0; flex: 1; }.create-card-heading p { margin: 0 0 3px; color: var(--color-dim); font-family: 'JetBrains Mono', monospace; font-size: 7px; font-weight: 600; letter-spacing: .08em; }.create-card-heading h3 { margin: 0; font-size: 13px; font-weight: 620; }.environment { flex: none; border-radius: 99px; padding: 5px 7px; font-family: 'JetBrains Mono', monospace; font-size: 7px; font-weight: 600; text-transform: uppercase; }.environment.browser { background: #eaf6f1; color: #24785d; }.environment.native { background: #fff0f3; color: #c63955; }.description { min-height: 54px; margin: 0; padding: 0 17px 12px; color: var(--color-muted); font-size: 9px; line-height: 1.55; }
  .repo-form { padding: 0 17px 15px; }.repo-form label { display: block; margin-bottom: 6px; color: var(--color-dim); font-size: 8px; font-weight: 600; }.repo-form > div { display: flex; min-height: 42px; align-items: center; overflow: hidden; border: 1px solid var(--color-line); border-radius: 8px; background: #faf9f6; }.repo-form > div > span { padding-left: 11px; color: var(--color-dim); font-family: 'JetBrains Mono', monospace; font-size: 9px; }.repo-form input { min-width: 70px; flex: 1; border: 0; padding: 11px 3px; outline: none; background: transparent; color: var(--color-ink); font-family: 'JetBrains Mono', monospace; font-size: 9px; }.repo-form button { align-self: stretch; border: 0; padding: 0 13px; background: var(--color-brand); color: #fff; font-size: 9px; font-weight: 620; }.repo-form button i { margin-left: 4px; font-style: normal; }.repo-form > small { display: block; margin-top: 6px; color: var(--color-danger); font-size: 8px; }.create-card footer { display: flex; min-height: 39px; align-items: center; gap: 14px; border-top: 1px solid var(--color-line-subtle); padding: 0 17px; color: var(--color-dim); font-size: 7px; text-transform: uppercase; }.create-card footer span::before { content: '✓'; margin-right: 4px; color: var(--color-success); }
  .mobile-card { background: #fcfbf8; }.template-row { display: flex; align-items: center; gap: 10px; margin: 0 17px 12px; border: 1px solid var(--color-line); border-radius: 9px; padding: 9px; background: #fff; }.template-preview { position: relative; width: 33px; height: 33px; flex: none; border-radius: 7px; background: #fff0f3; }.template-preview span { position: absolute; top: 8px; left: 8px; width: 16px; height: 5px; border-radius: 2px; background: var(--color-brand); }.template-preview i { position: absolute; bottom: 7px; left: 8px; width: 11px; height: 8px; border-radius: 2px; background: #fff; }.template-row > div:nth-child(2) { min-width: 0; flex: 1; }.template-row span, .template-row b, .template-row small { display: block; }.template-row span { color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 6px; letter-spacing: .08em; }.template-row b { margin-top: 2px; font-size: 10px; }.template-row small { margin-top: 2px; color: var(--color-dim); font-size: 7px; }.template-row em { border-radius: 99px; padding: 4px 6px; background: #eaf6f1; color: #24785d; font-style: normal; font-size: 7px; }.mobile-action { display: flex; min-height: 42px; align-items: center; justify-content: space-between; margin: 0 17px 15px; border-radius: 8px; padding: 0 12px; background: #302b27; color: #fff; text-decoration: none; }.mobile-action span { font-size: 9px; font-weight: 620; }.mobile-action small { display: block; margin-bottom: 1px; color: #aaa39a; font-family: 'JetBrains Mono', monospace; font-size: 6px; letter-spacing: .07em; }.mobile-action i { color: var(--color-brand); font-style: normal; }.mobile-card footer { justify-content: space-between; }.mobile-card footer a { color: var(--color-muted); text-decoration: none; text-transform: none; }
  .notice { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 13px; border: 1px solid var(--color-line); border-radius: 10px; padding: 10px 12px; background: #fff; font-size: 9px; }.notice > div { display: flex; gap: 6px; }.notice b { font-weight: 620; }.notice span { color: var(--color-muted); }.notice.success { border-color: rgba(47,163,122,.24); background: #f1faf6; }.notice button, .notice a { flex: none; border: 0; border-radius: 7px; padding: 7px 9px; background: var(--color-brand); color: #fff; font-size: 8px; font-weight: 600; text-decoration: none; }
  .mobile-header { display: none; }.center-state { display: flex; min-height: 100vh; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }.center-state img { border-radius: 14px; }.center-state h1 { margin: 15px 0 3px; font-size: 20px; }.center-state p { margin: 11px 0; color: var(--color-muted); font-size: 11px; }.center-state a { border-radius: 8px; padding: 9px 15px; background: var(--color-brand); color: #fff; font-size: 10px; font-weight: 600; text-decoration: none; }
  @media (max-width: 980px) { .dashboard-main { width: min(calc(100% - 36px),1180px); }.create-grid { grid-template-columns: 1fr; }.description { min-height: 0; }.overview article { align-items: flex-start; }.overview small { white-space: normal; } }
  @media (max-width: 760px) { .workspace { margin-left: 0; }.mobile-header { display: flex; height: 57px; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-line-subtle); padding: 0 15px; background: rgba(255,255,255,.65); }.mobile-header a { display: flex; align-items: center; gap: 8px; color: var(--color-ink); font-size: 12px; font-weight: 650; text-decoration: none; }.mobile-header img { border-radius: 8px; }.mobile-header > span { border: 1px solid var(--color-line); border-radius: 99px; padding: 4px 6px; background: #fff; color: var(--color-muted); font-family: 'JetBrains Mono', monospace; font-size: 7px; text-transform: uppercase; }.dashboard-main { width: min(calc(100% - 28px),1180px); padding: 27px 0 92px; }.page-heading { align-items: flex-start; flex-direction: column; margin-bottom: 20px; }.heading-actions { width: 100%; }.heading-actions a { flex: 1; text-align: center; }.overview { grid-template-columns: 1fr; gap: 8px; }.overview article { min-height: 68px; align-items: center; }.create-section > header { align-items: flex-start; flex-direction: column; gap: 5px; } }
  @media (max-width: 500px) { .page-heading h1 { font-size: 26px; }.page-heading > div:first-child > span { line-height: 1.45; }.heading-actions a:last-child { display: none; }.create-card-heading { align-items: flex-start; flex-wrap: wrap; }.create-card-heading > div { min-width: 150px; }.environment { margin-left: 44px; }.repo-form > div { flex-wrap: wrap; }.repo-form > div > span { flex: none; }.repo-form input { min-width: 120px; }.repo-form button { width: 100%; min-height: 38px; }.create-card footer { flex-wrap: wrap; gap: 6px 12px; padding-block: 10px; }.notice { align-items: flex-start; flex-direction: column; }.notice > div { flex-direction: column; gap: 2px; } }
</style>
