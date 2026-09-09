<script>
  import { onMount, onDestroy } from 'svelte';
  import Icon from './Icon.svelte';
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
  let isCopied = $state(false);
  let view = $state('web');
  let frameVersion = $state(0);
  let embeddedURL = $derived.by(() => { if (!previewURL) return ''; const url = new URL(previewURL); url.searchParams.set('__clank_embed', '1'); return url.toString(); });
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
      const name = status.service_name;
      status = await pollUntil(async () => {
        const [snapshot, tail] = await Promise.all([gateway.previewStatus(session.git_ref.worktree_id, name), gateway.previewLogs(session.git_ref.worktree_id, name)]);
        logs = tail; return snapshot;
      }, (snapshot) => ['ready', 'failed'].includes(snapshot.state), { signal: controller.signal, timeoutMs: 600000, onValue: (snapshot) => { status = snapshot; } });
      if (status.state === 'failed') throw new Error(status.last_err || 'The preview server couldn’t start.');
      if (!status.token) throw new Error('The host did not register a private preview URL.');
      const signed = await gateway.signPreviewToken(status.token, session.backend, session.id);
      previewURL = validatePreviewURL(signed.signed_url, GATEWAY_URL, PREVIEW_ROOT_DOMAIN, location.origin);
      view = status.kind === 'expo' && !status.can_preview_web ? 'phone' : 'web';
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
  <div class="preview-toolbar"><div><button class:chosen={view === 'web'} onclick={() => view = 'web'} disabled={status?.kind === 'expo' && !status.can_preview_web}><Icon name="web" size={16} />Preview</button>{#if status?.kind === 'expo'}<button class:chosen={view === 'phone'} onclick={() => view = 'phone'}><Icon name="mobile" size={16} />On your phone</button>{/if}</div><div><button class="icon-button" aria-label="Reload preview" onclick={() => previewURL && !error ? frameVersion++ : start()} disabled={isStarting}><Icon name="refresh" size={16} /></button>{#if previewURL}<a href={previewURL} target="_blank" rel="noreferrer" class="icon-button" aria-label="Open preview in new tab"><Icon name="external" size={16} /></a>{/if}</div></div>
  <div class="preview-stage" class:phone-size={status?.kind === 'expo' && view === 'web'}>
    {#if error || setupPrompt}<div class="preview-empty"><Icon name="web" size={30} /><h3>{setupPrompt ? 'Let’s prepare the preview.' : 'Preview needs attention'}</h3><p>{setupPrompt ? 'This project needs a launch recipe. Your agent can set it up.' : error}</p>{#if setupPrompt}<button class="primary-button" onclick={setup} disabled={session.status === 'busy'}>Ask agent to set up preview</button>{:else}<button class="quiet-button" onclick={start}>Start preview again</button>{/if}<button class="text-button" onclick={() => showLogs = !showLogs}>{showLogs ? 'Hide' : 'Show'} build output</button>{#if showLogs}<pre class="preview-logs">{logs}</pre>{/if}</div>
    {:else if !previewURL}<div class="preview-empty"><div class="empty-preview-geometry" aria-hidden="true"><Icon name="web" size={34} /></div><h3>Your idea is taking shape.</h3><p>{isStarting ? 'Preparing the live preview. The first start can take a few minutes.' : 'Your app will appear here.'}</p><button class="text-button" onclick={() => showLogs = !showLogs}>{showLogs ? 'Hide' : 'Show'} build output</button>{#if showLogs}<pre class="preview-logs">{logs || 'Waiting for the dev server…'}</pre>{/if}</div>
    {:else if view === 'phone'}<div class="preview-empty"><Icon name="mobile" size={36} /><h3>Try the native app.</h3><p>Open this private preview on a phone with Clank installed.</p><a class="primary-button" href={`clank://preview?url=${encodeURIComponent(previewURL)}`}>Open in Clank</a><button class="quiet-button" onclick={async () => { try { await navigator.clipboard.writeText(`clank://preview?url=${encodeURIComponent(previewURL)}`); isCopied = true; } catch { error = 'Couldn’t copy the phone link. Open this board on your phone.'; } }}>{isCopied ? 'Phone link copied' : 'Copy phone link'}</button><p class="small-note">The browser version is an approximation. Native-only features need your phone.</p></div>
    {:else}{#key frameVersion}<iframe src={embeddedURL} title="Live app preview" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads" referrerpolicy="no-referrer"></iframe>{/key}{/if}
  </div>
</div>
