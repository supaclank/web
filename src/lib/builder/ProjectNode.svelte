<script>
  import { getContext, onMount, onDestroy, untrack } from 'svelte';
  import { WORKSPACE_CONTEXT, applyAgentEvent, visibleMessages, reconcileHistory, transcriptMessages } from './model.js';
  import PreviewPanel from './PreviewPanel.svelte';
  import Transcript from './Transcript.svelte';
  import Icon from './Icon.svelte';
  let { id, data } = $props();
  const workspace = getContext(WORKSPACE_CONTEXT);
  let session = $state(untrack(() => data.session));
  let messages = $state([]);
  let permissions = $state([]);
  let text = $state('');
  let error = $state('');
  let isSending = $state(false);
  let isConnected = $state(false);
  let tab = $state('chat');
  let isLoading = $state(true);
  let transcript;
  let shouldScroll = true;
  let isRefreshing = false;
  let changedMessageIDs = new Set();
  let eventRevision = 0;
  let refreshTimer;
  let reconnectTimer;
  const controller = new AbortController();
  let shownMessages = $derived(transcriptMessages(visibleMessages(messages, session.revert_message_id)));
  onMount(() => { void connect(); refreshTimer = setInterval(() => void refresh(), 15000); });
  onDestroy(() => { controller.abort(); clearInterval(refreshTimer); clearTimeout(reconnectTimer); });
  $effect(() => { shownMessages; if (transcript && shouldScroll) requestAnimationFrame(() => { if (transcript) transcript.scrollTop = transcript.scrollHeight; }); });
  async function refresh() {
    if (isRefreshing || controller.signal.aborted) return;
    isRefreshing = true; changedMessageIDs = new Set();
    const revision = eventRevision;
    try {
      const [info, history, pending] = await Promise.all([workspace.gateway.session(id), workspace.gateway.messages(id, controller.signal), workspace.gateway.permissions(id, controller.signal)]);
      if (controller.signal.aborted) return;
      messages = reconcileHistory(history, messages, changedMessageIDs);
      if (revision === eventRevision) { session = info; permissions = pending; workspace.updated(info); }
    } catch (cause) { if (!controller.signal.aborted) error = cause.message; }
    finally { isRefreshing = false; isLoading = false; }
  }
  function receive(event) {
    eventRevision++;
    if (event.type === 'message') changedMessageIDs.add(event.data.id);
    if (event.type === 'part') changedMessageIDs.add(event.data.message_id);
    messages = applyAgentEvent(messages, event);
    if (event.type === 'status') { session = { ...session, status: event.data.new_status }; if (session.status !== 'busy') void refresh(); }
    if (event.type === 'title') session = { ...session, title: event.data.title };
    if (['status', 'title'].includes(event.type)) workspace.updated(session);
    if (event.type === 'permission') { permissions = [...permissions.filter((item) => item.request_id !== event.data.request_id), event.data]; }
    if (event.type === 'error') error = event.data.message;
  }
  async function connect() {
    await refresh();
    if (controller.signal.aborted) return;
    isConnected = true;
    try { await workspace.gateway.sessionEvents(id, receive, controller.signal); }
    catch (cause) { if (!controller.signal.aborted) error = cause.message; }
    finally { isConnected = false; if (!controller.signal.aborted) reconnectTimer = setTimeout(() => void connect(), 2500); }
  }
  async function send(event) {
    event?.preventDefault();
    if (!text.trim() || isSending || session.status === 'busy') return;
    isSending = true; error = ''; shouldScroll = true;
    const sentText = text.trim();
    try { await workspace.gateway.sendSessionMessage(id, sentText); text = ''; session = { ...session, status: 'busy' }; await refresh(); }
    catch (cause) { error = cause.message; }
    finally { isSending = false; }
  }
  async function stop() { try { await workspace.gateway.abortSession(id); await refresh(); } catch (cause) { error = cause.message; } }
  async function reply(permission, allow) {
    try { await workspace.gateway.replyPermission(id, permission.request_id, allow); permissions = permissions.filter((item) => item.request_id !== permission.request_id); }
    catch (cause) { error = cause.message; }
  }
</script>
<section class="project-node" aria-label={session.title || session.git_ref.display_name || 'Project'}>
  <header class="node-handle"><span><img src="/mascot.png" alt="" width="22" height="22" /><strong>{session.title || session.git_ref.display_name || 'Your project'}</strong></span><div><span class="agent-state" class:working={session.status === 'busy'}>{session.status === 'busy' ? 'Working' : session.status === 'idle' ? 'Ready' : session.status}</span><button class="icon-button nodrag" aria-label="Close project on board" onclick={() => workspace.close(id)}><Icon name="close" size={16} /></button></div></header>
  <div class="mobile-project-tabs nodrag nopan"><button class:chosen={tab === 'chat'} onclick={() => tab = 'chat'}>Chat</button><button class:chosen={tab === 'preview'} onclick={() => tab = 'preview'}>Preview</button></div>
  <div class="project-content nodrag nopan nowheel" class:show-preview={tab === 'preview'}>
    <div class="chat-panel"><div class="chat-heading"><span>Your conversation</span><small>{isConnected ? session.backend : 'Reconnecting…'}</small></div>
      <div class="transcript" bind:this={transcript} onscroll={() => { shouldScroll = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 80; }} aria-label="Conversation">
        {#if isLoading}<p class="small-note" role="status">Loading your conversation…</p>{:else}<Transcript messages={shownMessages} />{/if}
        {#each permissions as permission}<div class="permission-card"><strong>{permission.tool} needs your approval</strong><p>{permission.description}</p><div><button class="quiet-button" onclick={() => reply(permission, false)}>Decline</button><button class="primary-button" onclick={() => reply(permission, true)}>Allow</button></div></div>{/each}
        {#if session.status === 'busy'}<p class="thinking-status" role="status"><span></span>Clank is working on your app…</p>{/if}
      </div>
      {#if error}<div class="chat-error" role="alert">{error}<button class="text-button" onclick={() => { error = ''; void refresh(); }}>Refresh conversation</button></div>{/if}
      <form class="chat-composer" onsubmit={send}><label class="sr-only" for={`message-${id}`}>Message your agent</label><textarea id={`message-${id}`} bind:value={text} placeholder="What should we change?" rows="3" maxlength="20000" onkeydown={(event) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void send(event); }}></textarea><div class="composer-footer"><span>{session.status === 'busy' ? 'You can write your next idea while Clank works.' : 'Describe a change. Make it yours.'}</span>{#if session.status === 'busy'}<button type="button" class="send-button stop-button" onclick={stop} aria-label="Stop agent"><Icon name="stop" size={15} /></button>{:else}<button class="send-button" disabled={isSending || !text.trim()} aria-label="Send message"><Icon name="arrow" size={18} /></button>{/if}</div></form>
    </div>
    <PreviewPanel gateway={workspace.gateway} {session} />
  </div>
</section>
