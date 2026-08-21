<script>
  import { onMount } from 'svelte';
  import PreviewShelf from '$lib/workshop/PreviewShelf.svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { safeReturnTo, repositoryPath } from '$lib/navigation.js';
  import { CLOUD_MONTHLY_PLAN } from '$lib/pricing.js';
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
          { token: 'preview-one', service_name: 'supaclank-web', created_at: new Date(Date.now() - 11 * 60_000).toISOString() },
          { token: 'preview-two', service_name: 'habit-garden', created_at: new Date(Date.now() - 3 * 60 * 60_000).toISOString() },
          { token: 'preview-three', service_name: 'default', created_at: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString() }
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
  let planLabel = $derived(active ? 'Pro' : trialing && !needsPay ? `${status.days_left}d trial` : needsPay ? 'Trial ended' : 'Account');
</script>

<svelte:head>
  <title>Your workshop · Supaclank</title>
  <meta name="description" content="Create and reopen private web and mobile app previews in Supaclank." />
</svelte:head>

{#if phase === PAGE_LOADING}
  <main class="center-state"><img src="/mascot.png" alt="" width="52" height="52" /><p>Opening your workshop…</p></main>
{:else if phase === PAGE_SIGNED_OUT}
  <main class="center-state"><img src="/mascot.png" alt="" width="52" height="52" /><h1>You’re signed out</h1><p>Sign in to return to your workshop.</p><a href="/signup">Sign in</a></main>
{:else}
  <div class="workshop-page">
    <header class="topbar">
      <a href="/welcome" class="brand"><img src="/mascot.png" alt="" width="34" height="34" /><span>supaclank</span></a>
      <nav aria-label="Workshop navigation"><a href="#create">Create</a><a href="#previews">Previews</a><a href="/demo">Demo</a></nav>
      <details class="account">
        <summary><span class:attention={needsPay}>{planLabel}</span><i>{email.slice(0, 1).toUpperCase()}</i></summary>
        <div class="account-menu">
          <p>{email}</p>
          {#if active}<button type="button" onclick={manage} disabled={busy}>Manage subscription</button>{:else}<button type="button" onclick={subscribe} disabled={busy}>{CLOUD_MONTHLY_PLAN.checkoutLabel}</button>{/if}
          <button type="button" onclick={signOut}>Sign out</button>
          {#if error}<small>{error}</small>{/if}
        </div>
      </details>
    </header>

    {#if confirmMsg}<div class="notice success"><b>{confirmMsg.title}</b><span>{confirmMsg.body}</span></div>{/if}
    {#if confirming && !active}<div class="notice"><b>Confirming your subscription…</b><span>This updates by itself in a moment.</span></div>{/if}
    {#if needsPay}<div class="notice billing"><div><b>Your workshop is paused</b><span>Everything is still here. Subscribe when you’re ready to wake it up again.</span></div><button type="button" onclick={subscribe} disabled={busy}>{CLOUD_MONTHLY_PLAN.checkoutLabel}</button></div>{/if}
    {#if status?.allowed && returnTo !== '/welcome'}<div class="notice return"><div><b>Your preview is ready to continue</b><span>Pick up exactly where you left off.</span></div><a href={returnTo} onclick={clearCheckoutReturnTo}>Continue →</a></div>{/if}

    <main class="shell">
      <section class="intro" id="create">
        <p class="eyebrow">Your creative workshop</p>
        <h1>What do you want<br />to make today?</h1>
        <p class="lead">Choose a canvas. Your private machine stays asleep until you’re ready, then Supaclank sets up the workbench for you.</p>
        <div class="ready-note"><i></i><span><b>Ready when you are.</b> Opening a project wakes your workshop automatically.</span></div>
      </section>

      <section class="product-grid" aria-label="Ways to create">
        <article class="product web-product">
          <div class="product-top"><div><span class="number">01</span><span class="kind">Web</span></div><span class="where">Works in this browser</span></div>
          <div class="browser-art" aria-hidden="true">
            <div class="browser-chrome"><i></i><i></i><i></i><span>localhost:5173</span></div>
            <div class="browser-canvas"><b>Make the web<br />feel like yours.</b><span></span><em>✦</em></div>
          </div>
          <div class="product-copy"><h2>Shape a web experience</h2><p>Bring any frontend from GitHub. Supaclank creates a private branch and a live browser preview you can point at, talk to, and change.</p></div>
          <form class="repo-form" onsubmit={openRepository}>
            <label for="repo">GitHub repository</label>
            <div><span>github.com/</span><input id="repo" bind:value={repoInput} placeholder="owner/repository" autocomplete="off" spellcheck="false" /><button type="submit">Open workspace <i>→</i></button></div>
            {#if repoError}<small role="alert">{repoError}</small>{/if}
          </form>
          <div class="product-foot"><span>Private workspace</span><span>Live preview</span><span>AI editing overlay</span></div>
        </article>

        <article class="product mobile-product">
          <div class="product-top"><div><span class="number">02</span><span class="kind">Mobile</span></div><span class="where native">Native app required</span></div>
          <div class="mobile-art" aria-hidden="true">
            <div class="phone"><span></span><div><b>What should<br />we build?</b><i></i><em></em></div></div>
            <div class="idea one">A calmer habit tracker</div><div class="idea two">A camera for recipes</div><div class="spark">✦</div>
          </div>
          <div class="product-copy"><h2>Build something you can hold</h2><p>Create and edit native Expo apps from your phone. Shake to open Clank, tap what you mean, and describe the change.</p></div>
          <div class="fresh-start"><div><span>START FRESH</span><b>Expo 56 starter</b><p>Name the idea and the agent builds the first version.</p></div><span class="template-badge">Template</span></div>
          <a class="app-cta" href={PLAY_STORE_URL} target="_blank" rel="noreferrer"><span><small>GET THE NATIVE APP</small>Continue on Android</span><i>↗</i></a>
          <a class="try-demo" href="/demo">Try the web demo first <span>→</span></a>
        </article>
      </section>

      <PreviewShelf phase={previewPhase} {previews} error={previewError} {openingToken} onopen={openPreview} />
    </main>

    <footer><span>supaclank</span><p>A quiet place for loud ideas.</p><div><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div></footer>
  </div>
{/if}

<style>
  :global(body) { background: #faf8f4; }
  .workshop-page { min-height: 100vh; color: var(--color-ink); background-image: linear-gradient(rgba(0,0,0,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.035) 1px, transparent 1px); background-size: 28px 28px; }
  .topbar { position: relative; z-index: 10; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; width: min(calc(100% - 40px), 1120px); height: 72px; margin: 0 auto; border-bottom: 1px solid var(--color-line-subtle); }
  .brand { display: flex; align-items: center; gap: 9px; color: inherit; font-weight: 650; letter-spacing: -.02em; text-decoration: none; }.brand img { border-radius: 10px; }
  nav { display: flex; gap: 28px; } nav a { color: var(--color-muted); font-size: 13px; font-weight: 500; text-decoration: none; } nav a:hover { color: var(--color-ink); }
  .account { position: relative; justify-self: end; }.account summary { display: flex; align-items: center; gap: 9px; cursor: pointer; list-style: none; }.account summary::-webkit-details-marker { display: none; }.account summary > span { border: 1px solid var(--color-line); border-radius: 999px; padding: 5px 8px; background: rgba(255,255,255,.58); color: var(--color-muted); font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; }.account summary > span.attention { color: var(--color-danger); border-color: rgba(214,80,79,.25); }.account summary > i { display: grid; width: 31px; height: 31px; place-items: center; border-radius: 50%; background: var(--color-ink); color: var(--color-paper); font-style: normal; font-size: 12px; font-weight: 600; }
  .account-menu { position: absolute; top: 43px; right: 0; width: 230px; padding: 10px; border: 1px solid var(--color-line); border-radius: 13px; background: var(--color-elevated); box-shadow: 0 16px 40px rgba(32,25,20,.14); }.account-menu p { overflow: hidden; margin: 3px 6px 10px; color: var(--color-muted); font-size: 11px; text-overflow: ellipsis; }.account-menu button { width: 100%; border: 0; border-radius: 8px; padding: 9px; background: transparent; text-align: left; font-size: 12px; }.account-menu button:hover { background: var(--color-surface); }.account-menu small { display: block; padding: 5px; color: var(--color-danger); font-size: 10px; }
  .shell { width: min(calc(100% - 40px), 1120px); margin: 0 auto; }.intro { max-width: 780px; padding: clamp(58px, 9vw, 102px) 0 42px; scroll-margin-top: 24px; }.eyebrow { margin: 0 0 15px; color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: .11em; text-transform: uppercase; }.intro h1 { margin: 0; font-size: clamp(46px, 7vw, 78px); font-weight: 600; line-height: .96; letter-spacing: -.055em; text-wrap: balance; }.lead { max-width: 620px; margin: 25px 0 20px; color: var(--color-muted); font-size: 17px; line-height: 1.55; }.ready-note { display: flex; align-items: center; gap: 10px; color: var(--color-muted); font-size: 12px; }.ready-note i { width: 8px; height: 8px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 4px rgba(47,163,122,.11); }.ready-note b { color: var(--color-ink); font-weight: 600; }
  .product-grid { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(340px, .92fr); gap: 18px; }.product { position: relative; overflow: hidden; border: 1px solid var(--color-line); border-radius: 24px; background: rgba(255,255,255,.92); box-shadow: 0 20px 50px rgba(56,43,36,.07); }.product-top { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 15px; }.product-top > div { display: flex; align-items: center; gap: 10px; }.number { color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 10px; }.kind { font-size: 13px; font-weight: 650; }.where { border-radius: 999px; padding: 5px 8px; background: #eaf6f1; color: #24785d; font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; }.where.native { background: #fff0f3; color: #c63955; }
  .browser-art { margin: 0 22px; overflow: hidden; border: 1px solid rgba(0,0,0,.13); border-radius: 13px; box-shadow: 0 13px 30px rgba(0,0,0,.09); }.browser-chrome { display: flex; align-items: center; gap: 5px; height: 31px; padding: 0 10px; background: #292521; }.browser-chrome i { width: 6px; height: 6px; border-radius: 50%; background: #67615a; }.browser-chrome i:first-child { background: var(--color-brand); }.browser-chrome span { width: 58%; margin-left: 8px; border-radius: 5px; padding: 4px 8px; background: #3a3530; color: #a7a098; font-family: 'JetBrains Mono', monospace; font-size: 7px; }.browser-canvas { position: relative; height: 210px; overflow: hidden; padding: 35px; background: #f7f3eb; }.browser-canvas::before { position: absolute; inset: 0; content: ''; background-image: radial-gradient(rgba(0,0,0,.11) 1px, transparent 1px); background-size: 16px 16px; }.browser-canvas b { position: relative; z-index: 1; font-size: clamp(24px, 3vw, 39px); font-weight: 600; line-height: 1.04; letter-spacing: -.05em; }.browser-canvas span { position: absolute; right: 35px; bottom: 32px; width: 110px; height: 54px; border-radius: 8px; background: var(--color-brand); transform: rotate(-3deg); box-shadow: 8px 8px 0 #28231f; }.browser-canvas em { position: absolute; right: 68px; bottom: 44px; z-index: 2; color: #fff; font-style: normal; font-size: 23px; }
  .product-copy { padding: 24px 22px 18px; }.product-copy h2 { margin: 0 0 8px; font-size: 22px; font-weight: 600; letter-spacing: -.025em; }.product-copy p { margin: 0; color: var(--color-muted); font-size: 13px; line-height: 1.55; }.repo-form { padding: 0 22px 22px; }.repo-form label { display: block; margin-bottom: 7px; color: var(--color-muted); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; }.repo-form > div { display: flex; align-items: center; min-height: 47px; overflow: hidden; border: 1px solid var(--color-line); border-radius: 10px; background: var(--color-paper); }.repo-form > div > span { padding-left: 13px; color: var(--color-dim); font-family: 'JetBrains Mono', monospace; font-size: 11px; }.repo-form input { min-width: 50px; flex: 1; border: 0; padding: 13px 4px; outline: none; background: transparent; color: var(--color-ink); font-family: 'JetBrains Mono', monospace; font-size: 11px; }.repo-form button { align-self: stretch; border: 0; padding: 0 15px; background: var(--color-brand); color: #fff; font-size: 11px; font-weight: 650; }.repo-form button i { margin-left: 5px; font-style: normal; }.repo-form small { display: block; margin-top: 7px; color: var(--color-danger); font-size: 11px; }.product-foot { display: flex; gap: 18px; padding: 14px 22px 17px; border-top: 1px solid var(--color-line-subtle); color: var(--color-dim); font-size: 9px; text-transform: uppercase; letter-spacing: .04em; }.product-foot span::before { content: '✓'; margin-right: 5px; color: var(--color-success); }
  .mobile-product { background: #292521; color: #f8f4ec; }.mobile-product .product-top { border-bottom: 1px solid rgba(255,255,255,.07); }.mobile-art { position: relative; height: 241px; overflow: hidden; }.phone { position: absolute; top: 22px; left: 50%; width: 116px; height: 222px; padding: 7px; border: 2px solid #5b5550; border-radius: 25px; background: #111; transform: translateX(-50%) rotate(7deg); box-shadow: 18px 23px 34px rgba(0,0,0,.34); }.phone > span { position: absolute; top: 9px; left: 41px; z-index: 2; width: 35px; height: 7px; border-radius: 99px; background: #111; }.phone > div { height: 100%; overflow: hidden; border-radius: 18px; padding: 42px 13px; background: #fff2f3; color: #26211e; }.phone b { font-size: 14px; line-height: 1.1; letter-spacing: -.04em; }.phone i, .phone em { display: block; border-radius: 5px; }.phone i { width: 100%; height: 42px; margin-top: 21px; background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.08); }.phone em { width: 70%; height: 18px; margin-top: 9px; background: var(--color-brand); }.idea { position: absolute; border: 1px solid rgba(255,255,255,.13); border-radius: 8px; padding: 9px 11px; background: #3a3530; color: #ddd5cb; font-size: 9px; box-shadow: 0 8px 16px rgba(0,0,0,.2); }.idea.one { top: 55px; left: 20px; transform: rotate(-7deg); }.idea.two { right: 15px; bottom: 37px; transform: rotate(5deg); }.spark { position: absolute; top: 18px; right: 36px; color: var(--color-brand); font-size: 30px; }.mobile-product .product-copy { padding-top: 22px; }.mobile-product .product-copy p { color: #aaa39a; }.fresh-start { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0 22px 14px; padding: 13px; border: 1px solid rgba(255,255,255,.1); border-radius: 10px; background: rgba(255,255,255,.04); }.fresh-start div > span { display: block; color: var(--color-brand); font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: .08em; }.fresh-start b { display: block; margin-top: 4px; font-size: 12px; }.fresh-start p { margin: 2px 0 0; color: #908980; font-size: 9px; }.template-badge { border-radius: 99px; padding: 5px 7px; background: rgba(250,85,115,.13); color: #ff879d; font-size: 8px; }.app-cta { display: flex; align-items: center; justify-content: space-between; margin: 0 22px; border-radius: 10px; padding: 12px 14px; background: var(--color-brand); color: #fff; text-decoration: none; }.app-cta span { font-size: 12px; font-weight: 650; }.app-cta small { display: block; margin-bottom: 2px; color: #ffe4e9; font-family: 'JetBrains Mono', monospace; font-size: 7px; letter-spacing: .08em; }.app-cta i { font-style: normal; font-size: 17px; }.try-demo { display: block; padding: 13px 22px 17px; color: #aaa39a; font-size: 10px; text-align: center; text-decoration: none; }.try-demo span { color: var(--color-brand); }
  .notice { display: flex; align-items: center; gap: 8px; width: min(calc(100% - 40px), 1120px); margin: 14px auto 0; border: 1px solid var(--color-line); border-radius: 12px; padding: 11px 13px; background: rgba(255,255,255,.85); font-size: 12px; }.notice b { font-weight: 650; }.notice span { color: var(--color-muted); }.notice.success { border-color: rgba(47,163,122,.24); background: #eff9f5; }.notice.billing, .notice.return { justify-content: space-between; }.notice.billing > div, .notice.return > div { display: flex; gap: 8px; }.notice button, .notice a { flex: none; border: 0; border-radius: 8px; padding: 7px 10px; background: var(--color-brand); color: #fff; font-size: 11px; font-weight: 600; text-decoration: none; }
  footer { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; width: min(calc(100% - 40px), 1120px); margin: 0 auto; padding: 24px 0 34px; border-top: 1px solid var(--color-line-subtle); color: var(--color-muted); font-size: 11px; }footer > span { color: var(--color-ink); font-weight: 650; }footer p { margin: 0; }footer div { justify-self: end; display: flex; gap: 18px; }footer a { color: inherit; text-decoration: none; }
  .center-state { display: flex; min-height: 100vh; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }.center-state img { border-radius: 15px; }.center-state h1 { margin: 18px 0 5px; font-size: 23px; }.center-state p { margin: 13px 0; color: var(--color-muted); font-size: 13px; }.center-state a { border-radius: 9px; padding: 10px 18px; background: var(--color-brand); color: #fff; font-weight: 600; text-decoration: none; }
  @media (max-width: 850px) { .product-grid { grid-template-columns: 1fr; }.mobile-product { max-width: none; }.mobile-art { height: 270px; }.topbar { grid-template-columns: 1fr auto; }.topbar nav { display: none; }.product-foot { flex-wrap: wrap; } }
  @media (max-width: 560px) { .topbar, .shell, footer, .notice { width: min(calc(100% - 28px), 1120px); }.topbar { height: 64px; }.brand span { display: none; }.account summary > span { display: none; }.intro { padding: 50px 0 30px; }.intro h1 { font-size: clamp(44px, 14vw, 62px); }.lead { font-size: 15px; }.ready-note { align-items: start; line-height: 1.4; }.ready-note i { flex: none; margin-top: 4px; }.product { border-radius: 19px; }.browser-canvas { height: 175px; padding: 27px; }.browser-canvas span { right: 24px; bottom: 25px; width: 85px; }.browser-canvas em { right: 50px; bottom: 36px; }.repo-form > div { flex-wrap: wrap; }.repo-form > div > span { flex: none; }.repo-form input { min-width: 100px; }.repo-form button { width: 100%; min-height: 42px; }.product-foot { gap: 9px 14px; }.notice { align-items: start; flex-direction: column; }.notice.billing > div, .notice.return > div { flex-direction: column; gap: 2px; }footer { grid-template-columns: 1fr auto; gap: 7px; }footer p { display: none; } }
</style>
