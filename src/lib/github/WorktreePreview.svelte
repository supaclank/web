<script>
  import { onDestroy, onMount } from 'svelte';
  import AgentProviderConnect from '$lib/pull-request/AgentProviderConnect.svelte';
  import StatusCard from '$lib/pull-request/StatusCard.svelte';
  import {
    defaultPresetFor,
    onlyConnectedProvider,
    pollUntil,
    PREVIEW_SETUP_REQUIRED
  } from '$lib/pull-request-preview.js';

  let { gateway, launch, title, detail = '', displayName = title } = $props();

  let phase = $state('selecting-provider');
  let providers = $state([]);
  let selectedProvider = $state(null);
  let setupRequest = $state(null);
  let setupDetail = $state('Choosing an agent backend…');
  let previewStatus = $state(null);
  let previewURL = $state('');
  let logs = $state('');
  let error = $state('');
  let keepAlive;
  let controller = new AbortController();

  onMount(() => {
    void choosePreviewProvider();
  });

  onDestroy(() => {
    controller.abort();
    clearInterval(keepAlive);
  });

  async function choosePreviewProvider() {
    phase = 'selecting-provider';
    error = '';
    try {
      providers = await gateway.providers();
      if (!providers.length) throw new Error('Your Clank host does not offer any agent providers for this preview.');
      const onlyConnected = onlyConnectedProvider(providers);
      if (onlyConnected) {
        await usePreviewProvider(onlyConnected);
        return;
      }
      phase = 'agent-provider';
    } catch (cause) {
      fail(cause);
    }
  }

  async function usePreviewProvider(provider) {
    selectedProvider = provider;
    await startPreview();
  }

  async function startPreview() {
    phase = 'starting-preview';
    error = '';
    logs = '';
    previewStatus = null;
    setupRequest = null;
    setupDetail = 'Starting the preview service…';
    try {
      const status = await gateway.previewStart(launch.worktree_id);
      await waitForPreview(status);
    } catch (cause) {
      if (cause.code === PREVIEW_SETUP_REQUIRED) {
        setupRequest = cause.details;
        if (!setupRequest?.setup_prompt) {
          fail(new Error('The host requested preview setup without a setup prompt.'));
          return;
        }
        if (!selectedProvider) {
          fail(new Error('Select an agent backend before preparing this preview.'));
          return;
        }
        await configurePreview(selectedProvider);
        return;
      }
      fail(cause);
    }
  }

  async function configurePreview(provider) {
    selectedProvider = provider;
    phase = 'configuring';
    setupDetail = `Asking ${provider.display_name} to inspect the project…`;
    let sessionID = '';
    try {
      const presets = await gateway.presets(provider.backend);
      const preset = defaultPresetFor(presets, provider.backend);
      const session = await gateway.createSession({
        backend: provider.backend,
        hostname: 'local',
        git_ref: {
          worktree_id: launch.worktree_id,
          display_name: displayName
        },
        prompt: setupRequest.setup_prompt,
        config: preset.config
      });
      sessionID = session.id;
      await waitForSetupSession(sessionID);

      let status;
      try {
        status = await gateway.previewStart(launch.worktree_id);
      } catch (cause) {
        if (cause.code !== PREVIEW_SETUP_REQUIRED) throw cause;
        setupDetail = 'The generated recipe needs one correction…';
        await gateway.sendSessionMessage(sessionID, cause.details.setup_prompt);
        await waitForSetupSession(sessionID);
        status = await gateway.previewStart(launch.worktree_id);
      }
      try {
        await gateway.markSessionDone(sessionID);
      } catch (cause) {
        console.warn('Preview setup succeeded, but its agent session could not be marked done.', cause);
      }
      await waitForPreview(status);
    } catch (cause) {
      const suffix = sessionID ? ` Setup session: ${sessionID}.` : '';
      fail(new Error(`${cause.message || cause}${suffix}`));
    }
  }

  async function waitForSetupSession(sessionID) {
    await pollUntil(
      () => gateway.session(sessionID),
      (session) => ['idle', 'error', 'dead'].includes(session.status),
      {
        timeoutMs: 4 * 60_000,
        signal: controller.signal,
        onValue: (session) => {
          setupDetail = session.status === 'busy' ? 'The agent is writing the preview recipe…' : `Agent status: ${session.status}`;
        }
      }
    ).then((session) => {
      if (session.status !== 'idle') throw new Error(`Preview setup agent ended with ${session.status}.`);
    });
  }

  async function waitForPreview(initialStatus) {
    if (initialStatus.kind && initialStatus.kind !== 'web') {
      throw new Error(`This project configured a ${initialStatus.kind} preview; the web resolver needs a web preview.`);
    }
    const serviceName = initialStatus.service_name;
    if (!serviceName) throw new Error('The host started a preview without naming its service.');
    phase = 'starting-preview';
    previewStatus = initialStatus;
    setupDetail = 'Installing dependencies and waiting for the dev server…';

    const ready = await pollUntil(
      async () => {
        const [status, currentLogs] = await Promise.all([
          gateway.previewStatus(launch.worktree_id, serviceName),
          gateway.previewLogs(launch.worktree_id, serviceName)
        ]);
        logs = currentLogs || '';
        return status;
      },
      (status) => ['ready', 'failed'].includes(status.state),
      {
        timeoutMs: 10 * 60_000,
        signal: controller.signal,
        onValue: (status) => (previewStatus = status)
      }
    );
    if (ready.state === 'failed') throw new Error(ready.last_err || 'The preview server failed to start.');
    if (!ready.token) throw new Error('The host started the app but did not register a private preview URL.');
    if (!selectedProvider?.backend) throw new Error('The preview has no selected editing backend.');
    const signed = await gateway.signPreviewToken(ready.token, selectedProvider.backend);
    if (!signed.signed_url) throw new Error('The gateway returned an empty private preview URL.');
    previewURL = signed.signed_url;
    phase = 'ready';
    beginKeepAlive(serviceName);
  }

  function beginKeepAlive(serviceName) {
    clearInterval(keepAlive);
    keepAlive = setInterval(async () => {
      try {
        previewStatus = await gateway.previewStatus(launch.worktree_id, serviceName);
        if (previewStatus.state === 'failed') fail(new Error(previewStatus.last_err || 'The preview server stopped.'));
      } catch (cause) {
        fail(cause);
      }
    }, 30_000);
  }

  function fail(cause) {
    clearInterval(keepAlive);
    error = cause?.message || String(cause);
    phase = 'error';
  }

  function retry() {
    if (selectedProvider) return startPreview();
    return choosePreviewProvider();
  }
</script>

{#if phase === 'selecting-provider'}
  <StatusCard title="Preparing your editing agent…" detail={setupDetail} />
{:else if phase === 'agent-provider'}
  <AgentProviderConnect {gateway} {providers} onconnected={usePreviewProvider} />
{:else if phase === 'configuring'}
  <StatusCard title="One-time preview setup" detail={setupDetail} />
{:else if phase === 'starting-preview'}
  <StatusCard title="Starting your preview…" detail={setupDetail}>
    <p class="mt-4 break-all font-mono text-xs text-dim">{launch.worktree_dir}</p>
    {#if logs}<pre class="mt-5 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-ink p-4 text-xs text-paper">{logs}</pre>{/if}
  </StatusCard>
{:else if phase === 'error'}
  <div class="rounded-2xl border border-danger/30 bg-elevated p-6 shadow-sm">
    <p class="font-mono text-xs text-danger">PREVIEW STOPPED</p>
    <h1 class="mt-2 text-xl font-semibold">Couldn’t open this preview</h1>
    <p class="mt-2 break-words text-sm text-muted">{error}</p>
    <button class="mt-5 rounded-lg border border-line px-4 py-2 text-sm font-medium" onclick={retry}>Try again</button>
    {#if logs}<pre class="mt-5 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-ink p-4 text-xs text-paper">{logs}</pre>{/if}
  </div>
{:else if phase === 'ready'}
  <div class="rounded-2xl border border-success/30 bg-elevated p-6 shadow-sm sm:p-8">
    <div class="flex items-center gap-3"><span class="h-3 w-3 rounded-full bg-success"></span><p class="font-mono text-xs text-success">PRIVATE PREVIEW LIVE</p></div>
    <h1 class="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
    {#if detail}<p class="mt-2 font-mono text-xs text-muted">{detail}</p>{/if}
    <a href={previewURL} target="_blank" rel="noreferrer" class="mt-6 block rounded-lg bg-brand px-5 py-3 text-center font-medium text-white">Open private preview ↗</a>
    <p class="mt-3 text-center text-xs text-muted">Keep this resolver tab open while using the preview so the cloud dev server stays awake.</p>
    <p class="mt-6 break-all rounded-xl bg-surface p-3 font-mono text-xs text-dim">{launch.worktree_dir}</p>
  </div>
{/if}
