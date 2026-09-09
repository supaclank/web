<script>
  import { onMount, onDestroy } from 'svelte';
  import Icon from './Icon.svelte';
  import PreviewContent, { PREVIEW_KIND } from './PreviewContent.svelte';
  import { GATEWAY_URL, PREVIEW_ROOT_DOMAIN } from '../config.js';
  import { validatePreviewURL } from '../preview-origin.js';
  import { pollUntil, PREVIEW_SETUP_REQUIRED } from '../pull-request-preview.js';
  let { gateway, session } = $props();
  let status = $state(null);
  let previewURL = $state('');
  let logs = $state('');
  let error = $state('');
  let isStarting = $state(false);
  let setupPrompt = $state('');
  let showLogs = $state(false);
  let frameVersion = $state(0);
  let keepAlive;
  const controller = new AbortController();
  onMount(() => { void start(); });
  onDestroy(() => { controller.abort(); clearInterval(keepAlive); });
  async function start() {
    if (isStarting) return;
    isStarting = true; error = ''; setupPrompt = ''; previewURL = ''; clearInterval(keepAlive);
    try {
      status = await gateway.previewStart(session.git_ref.worktree_id);
      if (!status.service_name) throw new Error('The host returned a preview without a service name.');
      if (!Object.values(PREVIEW_KIND).includes(status.kind)) throw new Error('The host returned an unsupported preview kind.');
      const name = status.service_name;
      status = await pollUntil(async () => {
        const [snapshot, tail] = await Promise.all([gateway.previewStatus(session.git_ref.worktree_id, name), gateway.previewLogs(session.git_ref.worktree_id, name)]);
        logs = tail; return snapshot;
      }, (snapshot) => ['ready', 'failed'].includes(snapshot.state), { signal: controller.signal, timeoutMs: 600000, onValue: (snapshot) => { status = snapshot; } });
      if (status.state === 'failed') throw new Error(status.last_err || 'The preview server couldn’t start.');
      if (!status.token) throw new Error('The host did not register a private preview URL.');
      const signed = await gateway.signPreviewToken(status.token, session.backend, session.id);
      previewURL = validatePreviewURL(signed.signed_url, GATEWAY_URL, PREVIEW_ROOT_DOMAIN, location.origin);
      keepAlive = setInterval(async () => {
        try { status = await gateway.previewStatus(session.git_ref.worktree_id, name); if (status.state === 'failed' || status.state === 'stopped') { error = status.last_err || 'Preview stopped. Restart it to continue.'; clearInterval(keepAlive); } }
        catch (cause) { error = cause.message; }
      }, 30000);
    } catch (cause) {
      if (controller.signal.aborted) return;
      if (cause.code === PREVIEW_SETUP_REQUIRED) setupPrompt = cause.details.setup_prompt;
      else error = cause.message;
    } finally { isStarting = false; }
  }
  async function setup() {
    try { await gateway.sendSessionMessage(session.id, setupPrompt); setupPrompt = ''; error = 'The agent is preparing your preview. Start it again when the agent finishes.'; }
    catch (cause) { error = cause.message; }
  }
</script>
<div class="preview-panel">
  <div class="preview-toolbar">
    <span class="preview-label"><Icon name={status?.kind === PREVIEW_KIND.expo ? 'mobile' : 'web'} size={16} />{status?.kind === PREVIEW_KIND.expo ? 'On your phone' : 'Preview'}</span>
    <div>
      <button class="icon-button" aria-label={status?.kind === PREVIEW_KIND.expo ? 'Refresh phone preview link' : 'Reload preview'} onclick={() => status?.kind === PREVIEW_KIND.web && previewURL && !error ? frameVersion++ : start()} disabled={isStarting}><Icon name="refresh" size={16} /></button>
      {#if previewURL && status?.kind === PREVIEW_KIND.web}<a href={previewURL} target="_blank" rel="noreferrer" class="icon-button" aria-label="Open preview in new tab"><Icon name="external" size={16} /></a>{/if}
    </div>
  </div>
  <div class="preview-stage">
    {#if error || setupPrompt}<div class="preview-empty"><Icon name="web" size={30} /><h3>{setupPrompt ? 'Let’s prepare the preview.' : 'Preview needs attention'}</h3><p>{setupPrompt ? 'This project needs a launch recipe. Your agent can set it up.' : error}</p>{#if setupPrompt}<button class="primary-button" onclick={setup} disabled={session.status === 'busy'}>Ask agent to set up preview</button>{:else}<button class="quiet-button" onclick={start}>Start preview again</button>{/if}<button class="text-button" onclick={() => showLogs = !showLogs}>{showLogs ? 'Hide' : 'Show'} build output</button>{#if showLogs}<pre class="preview-logs">{logs}</pre>{/if}</div>
    {:else}<PreviewContent kind={status?.kind} {previewURL} {isStarting} {logs} {frameVersion} />{/if}
  </div>
</div>
