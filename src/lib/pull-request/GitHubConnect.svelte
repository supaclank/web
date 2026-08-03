<script>
  import { onDestroy } from 'svelte';
  import { pollUntil } from '$lib/pull-request-preview.js';

  let { gateway, onconnected } = $props();
  let phase = $state('idle');
  let flow = $state(null);
  let error = $state('');
  let isAlive = true;
  const controller = new AbortController();

  onDestroy(() => {
    isAlive = false;
    controller.abort();
  });

  async function begin() {
    phase = 'starting';
    error = '';
    try {
      flow = await gateway.githubConnectStart();
      phase = 'waiting';
      await pollUntil(
        () => gateway.githubConnectStatus(flow.flow_id),
        (status) => status.state !== 'pending',
        { intervalMs: Math.max(1_000, (flow.interval || 2) * 1_000), signal: controller.signal }
      ).then((status) => {
        if (status.state !== 'success') throw new Error(status.error || `GitHub authorization ended with ${status.state}.`);
        if (isAlive) onconnected(status);
      });
    } catch (cause) {
      if (!isAlive) return;
      error = cause.message || String(cause);
      phase = 'error';
    }
  }
</script>

<div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
  <div class="flex items-center gap-3">
    <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-paper">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z" /></svg>
    </div>
    <div>
      <h2 class="font-semibold">Connect GitHub to this machine</h2>
      <p class="text-sm text-muted">GitHub needs credentials on your Clank host to access this repository.</p>
    </div>
  </div>

  {#if phase === 'waiting' && flow}
    <div class="mt-5 rounded-xl bg-surface p-4 text-center">
      <p class="text-sm text-muted">Enter this one-time code on GitHub:</p>
      <button class="mt-2 font-mono text-2xl font-medium tracking-[0.22em]" onclick={() => navigator.clipboard?.writeText(flow.user_code)}>{flow.user_code}</button>
      <a class="mt-4 block rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper" href={flow.verification_uri_complete || flow.verification_uri} target="_blank" rel="noreferrer">Open GitHub to authorize ↗</a>
      <p class="mt-3 text-xs text-dim">Waiting for authorization…</p>
    </div>
  {:else}
    <button class="mt-5 w-full rounded-lg bg-ink px-4 py-2.5 font-medium text-paper disabled:opacity-50" onclick={begin} disabled={phase === 'starting'}>
      {phase === 'starting' ? 'Preparing a code…' : phase === 'error' ? 'Try GitHub again' : 'Connect GitHub'}
    </button>
  {/if}
  {#if error}<p class="mt-3 text-sm text-danger">{error}</p>{/if}
</div>
