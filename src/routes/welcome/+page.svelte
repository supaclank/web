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
  <main class="flex min-h-screen flex-col items-center justify-center bg-paper p-6 text-center"><img src="/mascot.png" alt="" width="48" height="48" class="rounded-xl" /><p class="mt-4 text-sm text-muted">Opening your workspace…</p></main>
{:else if phase === PAGE_SIGNED_OUT}
  <main class="flex min-h-screen flex-col items-center justify-center bg-paper p-6 text-center"><img src="/mascot.png" alt="" width="48" height="48" class="rounded-xl" /><h1 class="mt-4 text-xl font-semibold">You’re signed out</h1><p class="mt-2 text-sm text-muted">Sign in to return to your workspace.</p><a href="/signup" class="mt-5 rounded-lg bg-brand px-5 py-2.5 font-medium text-white">Sign in</a></main>
{:else}
  <div class="min-h-screen bg-paper text-ink">
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

    <div class="min-h-screen md:ml-64">
      <header class="flex h-16 items-center justify-between border-b border-line-subtle bg-elevated px-5 md:hidden"><a href="/welcome" class="flex items-center gap-2.5 font-semibold tracking-tight"><img src="/mascot.png" alt="" width="32" height="32" class="rounded-lg" /><span>supaclank</span></a><span class="text-sm text-muted">Personal</span></header>

      <main id="dashboard" class="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <div class="mb-10 flex flex-col gap-2 border-b border-line-subtle pb-5 sm:flex-row sm:items-center sm:justify-between">
          <span class="text-sm font-medium">Personal workspace</span>
          <span class="flex items-center gap-2 text-sm text-muted"><i class="h-2 w-2 rounded-full bg-success"></i>Your cloud workspace starts when you need it.</span>
        </div>

        <div class="mx-auto mb-6 max-w-4xl space-y-3">
          {#if confirmMsg}<div class="flex flex-col gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm sm:flex-row"><strong>{confirmMsg.title}</strong><span class="text-muted">{confirmMsg.body}</span></div>{/if}
          {#if confirming && !active}<div class="flex flex-col gap-2 rounded-xl border border-line bg-elevated p-4 text-sm sm:flex-row"><strong>Confirming your subscription…</strong><span class="text-muted">This updates by itself in a moment.</span></div>{/if}
          {#if needsPay}<div class="flex flex-col items-start justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm sm:flex-row sm:items-center"><div><strong class="block">Your workspace is paused</strong><span class="mt-1 block text-muted">Everything is still here. Renew when you’re ready to wake it up again.</span></div><button type="button" class="shrink-0 rounded-lg bg-brand px-4 py-2.5 font-medium text-white disabled:opacity-50" onclick={subscribe} disabled={busy}>Renew access</button></div>{/if}
          {#if status?.allowed && returnTo !== '/welcome'}<div class="flex flex-col items-start justify-between gap-3 rounded-xl border border-info/30 bg-info/10 p-4 text-sm sm:flex-row sm:items-center"><div><strong class="block">Your preview is ready</strong><span class="mt-1 block text-muted">Pick up exactly where you left off.</span></div><a href={returnTo} class="shrink-0 rounded-lg bg-brand px-4 py-2.5 font-medium text-white" onclick={clearCheckoutReturnTo}>Continue →</a></div>{/if}
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
          <section class="mx-auto mt-10 max-w-3xl scroll-mt-6" aria-labelledby="new-project-heading">
            <header class="mb-4"><p class="font-mono text-xs text-success">FIRST VERSION BUILT</p><h2 id="new-project-heading" class="mt-2 text-2xl font-semibold tracking-tight">{createdProject.display_name}</h2><span class="mt-1 block text-sm text-muted">Now starting its private Expo Web preview.</span></header>
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
