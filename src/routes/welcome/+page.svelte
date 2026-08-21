<script>
  import { onDestroy, onMount } from 'svelte';
  import WorktreePreview from '$lib/github/WorktreePreview.svelte';
  import PreviewShelf from '$lib/workshop/PreviewShelf.svelte';
  import PromptComposer from '$lib/workshop/PromptComposer.svelte';
  import Sidebar from '$lib/workshop/Sidebar.svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { safeReturnTo, repositoryPath } from '$lib/navigation.js';
  import { ClankGateway } from '$lib/clank-gateway.js';
  import { FREE_AI_CHOICE } from '$lib/free-ai.js';
  import { defaultPresetFor, pollUntil } from '$lib/pull-request-preview.js';
  import { githubRepositoryFrom } from '$lib/workshop.js';
  import { expoTemplateFrom, mobileAgentPrompt, projectNameFromPrompt } from '$lib/workshop-create.js';

  const PAGE_LOADING = 'loading';
  const PAGE_SIGNED_OUT = 'signedout';
  const PAGE_READY = 'ready';
  const PREVIEWS_LOADING = 'loading';
  const PREVIEWS_READY = 'ready';
  const WORKSHOP_FIXTURE_QUERY = 'workshop_fixture';
  const WORKSHOP_FIXTURE_POPULATED = 'populated';
  const CREATE_IDLE = 'idle';
  const CREATE_WAKING = 'waking';
  const CREATE_SCAFFOLDING = 'scaffolding';
  const CREATE_STARTING_AGENT = 'starting-agent';
  const CREATE_BUILDING = 'building';
  const CREATE_PREVIEW = 'preview';
  const CREATE_ERROR = 'error';

  let phase = $state(PAGE_LOADING);
  let previewPhase = $state(PREVIEWS_LOADING);
  let previews = $state([]);
  let previewError = $state('');
  let openingToken = $state('');
  let createPhase = $state(CREATE_IDLE);
  let createDetail = $state('');
  let createError = $state('');
  let createdProject = $state(null);
  let createdSession = $state(null);
  let confirmMsg = $state(null);
  let status = $state(null);
  let email = $state('');
  let busy = $state(false);
  let confirming = $state(false);
  let error = $state('');
  let supabase;
  let gateway = $state(null);
  let gatewayURL = '';
  let token = '';
  let returnTo = $state('/welcome');
  let isDevelopmentFixture = false;
  const createController = new AbortController();

  onDestroy(() => createController.abort());

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

    isDevelopmentFixture = true;
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

  function openRepository(repository) {
    createError = '';
    try {
      const { owner, repo } = githubRepositoryFrom(repository);
      location.href = repositoryPath(owner, repo);
    } catch (cause) {
      createError = cause?.message || String(cause);
    }
  }

  async function createMobileApp(prompt) {
    createError = '';
    createdProject = null;
    createdSession = null;

    if (isDevelopmentFixture) {
      createPhase = CREATE_BUILDING;
      createDetail = 'Development fixture: the real flow wakes the host, scaffolds Expo, and starts the agent.';
      return;
    }

    try {
      const name = projectNameFromPrompt(prompt);
      createPhase = CREATE_WAKING;
      createDetail = 'Waking your private workspace and loading its templates…';
      const template = expoTemplateFrom(await gateway.templates());

      createPhase = CREATE_SCAFFOLDING;
      createDetail = 'Creating a clean Expo project and its first branch…';
      createdProject = await gateway.createProject({ clone_url: template.clone_url, name });

      createPhase = CREATE_STARTING_AGENT;
      createDetail = 'Starting the coding agent inside your new project…';
      const presets = await gateway.presets(FREE_AI_CHOICE.backend);
      const preset = defaultPresetFor(presets, FREE_AI_CHOICE.backend);
      createdSession = await gateway.createSession({
        backend: FREE_AI_CHOICE.backend,
        hostname: 'local',
        git_ref: {
          worktree_id: createdProject.worktree_id,
          display_name: createdProject.display_name
        },
        prompt: mobileAgentPrompt(prompt),
        config: preset.config
      });

      createPhase = CREATE_BUILDING;
      createDetail = 'Writing screens, interactions, and the first working app…';
      const finished = await pollUntil(
        () => gateway.session(createdSession.id),
        (session) => ['idle', 'error', 'dead'].includes(session.status),
        {
          timeoutMs: 10 * 60_000,
          signal: createController.signal,
          onValue: (session) => {
            if (session.status === 'busy') createDetail = 'Clank is coding your first version. You can stay on this page.';
          }
        }
      );
      if (finished.status !== 'idle') throw new Error(`The build agent ended with ${finished.status}.`);
      createPhase = CREATE_PREVIEW;
    } catch (cause) {
      if (cause?.name === 'AbortError') return;
      createError = cause?.message || String(cause);
      createPhase = CREATE_ERROR;
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
  let createBusy = $derived([CREATE_WAKING, CREATE_SCAFFOLDING, CREATE_STARTING_AGENT, CREATE_BUILDING].includes(createPhase));
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
      <header class="mobile-header"><a href="/welcome"><img src="/mascot.png" alt="" width="30" height="30" /><span>supaclank</span></a><span>Personal</span></header>

      <main id="dashboard" class="dashboard-main">
        <div class="workspace-heading"><span>Personal workspace</span><div><i></i>Your cloud workspace sleeps until you create or reopen something.</div></div>

        <div class="notices">
          {#if confirmMsg}<div class="notice success"><div><b>{confirmMsg.title}</b><span>{confirmMsg.body}</span></div></div>{/if}
          {#if confirming && !active}<div class="notice"><div><b>Confirming your subscription…</b><span>This updates by itself in a moment.</span></div></div>{/if}
          {#if needsPay}<div class="notice billing"><div><b>Your workspace is paused</b><span>Everything is still here. Renew when you’re ready to wake it up again.</span></div><button type="button" onclick={subscribe} disabled={busy}>Renew access</button></div>{/if}
          {#if status?.allowed && returnTo !== '/welcome'}<div class="notice return"><div><b>Your preview is ready</b><span>Pick up exactly where you left off.</span></div><a href={returnTo} onclick={clearCheckoutReturnTo}>Continue →</a></div>{/if}
        </div>

        <PromptComposer
          busy={createBusy}
          phase={createPhase}
          detail={createDetail}
          error={createError}
          {needsPay}
          onmobilecreate={createMobileApp}
          onrepositoryopen={openRepository}
        />

        {#if createPhase === CREATE_PREVIEW && createdProject}
          <section class="new-project" aria-labelledby="new-project-heading">
            <header><p>FIRST VERSION BUILT</p><h2 id="new-project-heading">{createdProject.display_name}</h2><span>Now starting its private Expo Web preview.</span></header>
            <WorktreePreview
              {gateway}
              launch={createdProject}
              title={createdProject.display_name}
              detail="Expo app · main"
              displayName={createdProject.display_name}
              initialProvider={FREE_AI_CHOICE}
            />
          </section>
        {/if}

        <PreviewShelf phase={previewPhase} {previews} error={previewError} {openingToken} onopen={openPreview} />
      </main>
    </div>
  </div>
{/if}

<style>
  :global(body) { background: #faf8f4; }
  .dashboard-shell { min-height: 100vh; color: var(--color-ink); background-image: linear-gradient(rgba(0,0,0,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.025) 1px, transparent 1px); background-size: 28px 28px; }
  .workspace { min-height: 100vh; margin-left: 214px; }
  .dashboard-main { width: min(calc(100% - 44px), 960px); margin: 0 auto; padding: 24px 0 0; }
  .workspace-heading { display: flex; min-height: 36px; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid var(--color-line-subtle); padding: 0 2px 12px; }
  .workspace-heading > span { font-size: 11px; font-weight: 650; }
  .workspace-heading > div { display: flex; align-items: center; gap: 7px; color: var(--color-dim); font-size: 9px; }
  .workspace-heading i { width: 6px; height: 6px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 3px rgba(47,163,122,.1); }
  .notices { max-width: 860px; margin: 13px auto 0; }
  .notice { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 8px; border: 1px solid var(--color-line); border-radius: 10px; padding: 10px 12px; background: rgba(255,255,255,.88); font-size: 9px; }
  .notice > div { display: flex; gap: 6px; }
  .notice b { font-weight: 650; }.notice span { color: var(--color-muted); }
  .notice.success { border-color: rgba(47,163,122,.24); background: #f1faf6; }
  .notice button, .notice a { flex: none; border: 0; border-radius: 7px; padding: 7px 9px; background: var(--color-brand); color: #fff; font-size: 8px; font-weight: 600; text-decoration: none; }
  .new-project { max-width: 760px; margin: 0 auto 54px; scroll-margin-top: 20px; }
  .new-project > header { margin-bottom: 13px; text-align: center; }
  .new-project > header p { margin: 0 0 5px; color: var(--color-success); font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 650; letter-spacing: .1em; }
  .new-project h2 { margin: 0; font-size: 24px; letter-spacing: -.035em; }
  .new-project > header span { display: block; margin-top: 5px; color: var(--color-muted); font-size: 11px; }
  .mobile-header { display: none; }
  .center-state { display: flex; min-height: 100vh; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
  .center-state img { border-radius: 14px; }.center-state h1 { margin: 15px 0 3px; font-size: 20px; }.center-state p { margin: 11px 0; color: var(--color-muted); font-size: 11px; }.center-state a { border-radius: 8px; padding: 9px 15px; background: var(--color-brand); color: #fff; font-size: 10px; font-weight: 600; text-decoration: none; }
  @media (max-width: 760px) {
    .workspace { margin-left: 0; }
    .mobile-header { display: flex; height: 57px; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-line-subtle); padding: 0 15px; background: rgba(255,255,255,.72); backdrop-filter: blur(14px); }
    .mobile-header a { display: flex; align-items: center; gap: 8px; color: var(--color-ink); font-size: 12px; font-weight: 650; text-decoration: none; }.mobile-header img { border-radius: 8px; }
    .mobile-header > span { color: var(--color-muted); font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; }
    .dashboard-main { width: min(calc(100% - 28px), 960px); padding-top: 15px; }
    .workspace-heading { display: none; }
  }
  @media (max-width: 520px) {
    .notice { align-items: flex-start; flex-direction: column; }.notice > div { flex-direction: column; gap: 2px; }
  }
</style>
