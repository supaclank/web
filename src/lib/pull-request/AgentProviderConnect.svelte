<script>
  import { onDestroy } from 'svelte';
  import { FREE_AI_CHOICE } from '$lib/free-ai.js';
  import { groupProviderChoices, pollUntil } from '$lib/pull-request-preview.js';

  let { gateway, providers, onconnected } = $props();
  let selected = $state(null);
  let phase = $state('choose');
  let flow = $state(null);
  let apiKey = $state('');
  let oauthCode = $state('');
  let metadata = $state({});
  let error = $state('');
  let showProviderCatalog = $state(false);
  let providerQuery = $state('');
  let isAlive = true;
  const controller = new AbortController();
  let providerGroups = $derived(groupProviderChoices(providers, providerQuery));
  let hasAvailableProviders = $derived(providers.some((provider) => !provider.connected));

  onDestroy(() => {
    isAlive = false;
    controller.abort();
  });

  function choose(provider) {
    selected = provider;
    error = '';
    if (provider.connected) {
      onconnected(provider);
      return;
    }
    phase = provider.auth_type === 'api' ? 'apikey' : 'confirm';
  }

  function toggleProviderCatalog() {
    showProviderCatalog = !showProviderCatalog;
    if (!showProviderCatalog) providerQuery = '';
  }

  async function start() {
    error = '';
    try {
      if (selected.auth_type === 'device') {
        phase = 'starting';
        flow = await gateway.providerDeviceStart(selected.provider_id);
        phase = 'waiting';
        const status = await pollUntil(
          () => gateway.providerFlowStatus(selected.provider_id, flow.flow_id),
          (value) => !['pending', 'authorized'].includes(value.state),
          { intervalMs: Math.max(1_000, (flow.interval || 2) * 1_000), signal: controller.signal }
        );
        if (status.state !== 'success') throw new Error(status.error || `Provider authorization ended with ${status.state}.`);
        if (isAlive) onconnected({ ...selected, connected: true });
        return;
      }
      if (selected.auth_type === 'oauth-code') {
        phase = 'starting';
        flow = await gateway.providerOAuthStart(selected.provider_id);
        phase = 'oauth';
      }
    } catch (cause) {
      showError(cause);
    }
  }

  async function saveKey(event) {
    event.preventDefault();
    phase = 'starting';
    error = '';
    try {
      flow = await gateway.providerAPIKey(selected.provider_id, apiKey.trim(), metadata);
      const status = await pollUntil(
        () => gateway.providerFlowStatus(selected.provider_id, flow.flow_id),
        (value) => value.state !== 'pending',
        { signal: controller.signal }
      );
      if (status.state !== 'success') throw new Error(status.error || `Saving the credential ended with ${status.state}.`);
      if (isAlive) onconnected({ ...selected, connected: true });
    } catch (cause) {
      showError(cause);
    }
  }

  async function submitOAuth(event) {
    event.preventDefault();
    phase = 'starting';
    try {
      await gateway.providerOAuthSubmit(selected.provider_id, flow.flow_id, oauthCode.trim());
      if (isAlive) onconnected({ ...selected, connected: true });
    } catch (cause) {
      showError(cause);
    }
  }

  function showError(cause) {
    if (!isAlive) return;
    error = cause.message || String(cause);
    phase = 'error';
  }
</script>

<div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
  <h2 class="text-lg font-semibold">Choose AI for this preview</h2>
  <p class="mt-1 text-sm text-muted">Start instantly with free OpenCode, or connect an account you already use. The same choice powers preview setup and editing.</p>

  {#if phase === 'choose'}
    <button
      class="mt-5 w-full rounded-xl bg-brand px-4 py-3.5 text-left text-white shadow-sm hover:brightness-95"
      onclick={() => onconnected(FREE_AI_CHOICE)}
    >
      <span class="flex items-center justify-between gap-3">
        <span class="font-semibold">Start with free AI</span>
        <span class="rounded-full bg-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wide">No credentials</span>
      </span>
      <span class="mt-1 block text-sm text-white/80">{FREE_AI_CHOICE.display_name} · currently {FREE_AI_CHOICE.current_model_name}</span>
    </button>
    <p class="mt-2 text-xs leading-5 text-dim">The free model is rate-limited and may produce lower-quality results.</p>

    {#if providerGroups.connected.length > 0}
      <p class="mt-5 font-mono text-[10px] uppercase tracking-wide text-dim">Connected providers</p>
      <div class="mt-2 grid gap-2">
        {#each providerGroups.connected as provider}
          <button class="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-left hover:bg-surface" onclick={() => choose(provider)}>
            <span><span class="block text-sm font-medium">{provider.display_name}</span><span class="block text-xs text-muted">{provider.backend}</span></span>
            <span class="text-xs font-medium text-success">Use connected</span>
          </button>
        {/each}
      </div>
    {/if}

    {#if hasAvailableProviders}
      <button
        class="mt-5 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left text-sm font-medium hover:bg-surface"
        aria-expanded={showProviderCatalog}
        onclick={toggleProviderCatalog}
      >
        <span>Connect your own provider</span>
        <span class="text-xs text-muted">{showProviderCatalog ? 'Hide' : `${providerGroups.available.length} choices`}</span>
      </button>

      {#if showProviderCatalog}
        <div class="mt-3 rounded-xl border border-line bg-paper p-3">
          <input
            class="w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm"
            type="search"
            placeholder="Search providers"
            aria-label="Search AI providers"
            bind:value={providerQuery}
          />
          <div class="mt-2 grid max-h-72 gap-2 overflow-y-auto pr-1">
            {#each providerGroups.available as provider}
              <button class="flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-surface" onclick={() => choose(provider)}>
                <span><span class="block text-sm font-medium">{provider.display_name}</span><span class="block text-xs text-muted">{provider.backend}</span></span>
                <span class="text-xs text-muted">Connect</span>
              </button>
            {:else}
              <p class="px-3 py-4 text-center text-sm text-muted">No providers match that search.</p>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  {:else if phase === 'confirm'}
    <button class="mt-5 w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white" onclick={start}>Continue with {selected.display_name}</button>
  {:else if phase === 'waiting' && flow}
    <div class="mt-5 rounded-xl bg-surface p-4 text-center">
      <p class="text-sm text-muted">Enter this code to connect {selected.display_name}:</p>
      <button class="mt-2 font-mono text-2xl font-medium tracking-[0.22em]" onclick={() => navigator.clipboard?.writeText(flow.user_code)}>{flow.user_code}</button>
      <a class="mt-4 block rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white" href={flow.verification_url} target="_blank" rel="noreferrer">Open authorization page ↗</a>
      <p class="mt-3 text-xs text-dim">Waiting for authorization…</p>
    </div>
  {:else if phase === 'apikey'}
    <form class="mt-5 space-y-3" onsubmit={saveKey}>
      {#each selected.prompts || [] as prompt}
        <label class="block text-sm font-medium">{prompt.message}<input class="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-mono text-sm" placeholder={prompt.placeholder || ''} required value={metadata[prompt.key] || ''} oninput={(event) => (metadata = { ...metadata, [prompt.key]: event.currentTarget.value })} /></label>
      {/each}
      <label class="block text-sm font-medium">API key<input class="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-mono text-sm" type="password" bind:value={apiKey} required autocomplete="off" /></label>
      <button class="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white">Save on my Clank host</button>
    </form>
  {:else if phase === 'oauth' && flow}
    <form class="mt-5 space-y-3" onsubmit={submitOAuth}>
      <a class="block rounded-lg bg-brand px-4 py-2.5 text-center font-medium text-white" href={flow.verification_url} target="_blank" rel="noreferrer">Open authorization page ↗</a>
      <label class="block text-sm font-medium">Paste the verification code<input class="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-mono text-sm" bind:value={oauthCode} required autocomplete="off" /></label>
      <button class="w-full rounded-lg border border-line px-4 py-2.5 font-medium">Finish connecting</button>
    </form>
  {:else if phase === 'starting'}
    <p class="mt-5 text-sm text-muted">Connecting {selected?.display_name}…</p>
  {:else if phase === 'error'}
    <button class="mt-5 rounded-lg border border-line px-4 py-2 text-sm font-medium" onclick={() => (phase = 'choose')}>Choose a provider</button>
  {/if}
  {#if error}<p class="mt-3 text-sm text-danger">{error}</p>{/if}
</div>
