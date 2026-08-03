<script>
  import { onDestroy } from 'svelte';
  import { pollUntil } from '$lib/pull-request-preview.js';

  let { gateway, providers, onconnected } = $props();
  let selected = $state(null);
  let phase = $state('choose');
  let flow = $state(null);
  let apiKey = $state('');
  let oauthCode = $state('');
  let metadata = $state({});
  let error = $state('');
  let isAlive = true;
  const controller = new AbortController();

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
  <h2 class="text-lg font-semibold">Choose an agent for this preview</h2>
  <p class="mt-1 text-sm text-muted">The web overlay will use this backend for a new editing session. If the repo needs a preview recipe, the same agent will prepare it first.</p>

  {#if phase === 'choose'}
    <div class="mt-5 grid gap-2">
      {#each providers as provider}
        <button class="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-left hover:bg-surface" onclick={() => choose(provider)}>
          <span><span class="block text-sm font-medium">{provider.display_name}</span><span class="block text-xs text-muted">{provider.backend}</span></span>
          <span class={provider.connected ? 'text-xs font-medium text-success' : 'text-xs text-muted'}>{provider.connected ? 'Use connected' : 'Connect'}</span>
        </button>
      {/each}
    </div>
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
