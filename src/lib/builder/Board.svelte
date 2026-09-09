<script>
  import { setContext, onMount } from 'svelte';
  import { SvelteFlow, SvelteFlowProvider, Controls, Background } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import DraftNode from './DraftNode.svelte';
  import ProjectNode from './ProjectNode.svelte';
  import Icon from './Icon.svelte';
  import { WORKSPACE_CONTEXT, BOARD_KEY, projectNodes, mergeBoardNodes, parseBoard } from './model.js';
  let { gateway, supabase, user, draft = null, onhome, shouldAutoStart = false, ondraftconsumed } = $props();
  let nodes = $state.raw([]);
  let edges = $state.raw([]);
  let viewport = $state.raw({ x: 80, y: 80, zoom: 1 });
  let sessions = $state([]);
  let isLoading = $state(false);
  let error = $state('');
  let showChats = $state(false);
  let isMounted = $state(false);
  let loadedUserID = '';
  const nodeTypes = { draft: DraftNode, project: ProjectNode };
  setContext(WORKSPACE_CONTEXT, { get gateway() { return gateway; }, get supabase() { return supabase; }, get user() { return user; }, created, close: closeNode, updated: updateSession });
  onMount(() => {
    isMounted = true;
    if (window.innerWidth < 700) viewport = { x: 16, y: 28, zoom: 1 };
    if (draft || !user) newProject(draft);
  });
  $effect(() => {
    if (isMounted && user && gateway && loadedUserID !== user.id) { loadedUserID = user.id; void restore(); }
  });
  $effect(() => {
    if (!isMounted || !user || isLoading) return;
    const saved = nodes.filter((node) => node.type === 'project').map(({ id, position }) => ({ id, position }));
    try { localStorage.setItem(BOARD_KEY + user.id, JSON.stringify({ nodes: saved, viewport })); }
    catch { error = 'Your board layout couldn’t be saved in this browser. Your projects are still saved on your host.'; }
  });
  async function restore() {
    isLoading = true; error = '';
    try {
      const loadedSessions = (await gateway.sessions()).filter((session) => session.git_ref?.worktree_id && session.visibility !== 'archived');
      sessions = [...sessions, ...loadedSessions.filter((item) => !sessions.some((live) => live.id === item.id))];
      try {
      const raw = localStorage.getItem(BOARD_KEY + user.id);
      if (raw) {
        const saved = parseBoard(raw);
        if (Array.isArray(saved.nodes)) nodes = mergeBoardNodes(projectNodes(sessions, saved.nodes), nodes);
        if ([saved.viewport?.x, saved.viewport?.y, saved.viewport?.zoom].every(Number.isFinite) && saved.viewport.zoom >= 0.25 && saved.viewport.zoom <= 1.5) viewport = saved.viewport;
      }
      } catch { error = 'Your saved layout couldn’t be restored. Your projects are available below.'; }
      const requestedID = new URLSearchParams(location.search).get('session');
      const requested = sessions.find((session) => session.id === requestedID);
      if (requested) openSession(requested);
      else if (requestedID) error = 'This conversation is unavailable on your account. Choose one from Projects.';
      if (nodes.length === 0) { if (sessions.length) openSession(sessions[0]); else newProject(draft); }
    } catch (cause) { error = cause.status === 402 ? 'Cloud access needs attention. Open Account to manage your trial or subscription.' : cause.message; }
    finally { isLoading = false; }
  }
  function nextPosition() { return { x: nodes.length ? Math.max(...nodes.map((node) => node.position.x)) + 1180 : 0, y: 0 }; }
  function focusNode(node) {
    const width = window.innerWidth < 700 ? 350 : node.type === 'project' ? 1080 : 430;
    const zoom = Math.min(1, (window.innerWidth - 32) / width);
    viewport = { x: 16 - node.position.x * zoom, y: 28 - node.position.y * zoom, zoom };
  }
  function newProject(initial = null) {
    const existing = nodes.find((node) => node.type === 'draft');
    if (existing) { focusNode(existing); return; }
    const node = { id: crypto.randomUUID(), type: 'draft', dragHandle: '.node-handle', position: nextPosition(), data: { draft: initial, autoStart: Boolean(initial?.prompt) && shouldAutoStart } };
    nodes = [...nodes, node];
    if (isMounted) focusNode(node);
  }
  function openSession(session) {
    let node = nodes.find((node) => node.id === session.id);
    if (!node) { node = { id: session.id, type: 'project', dragHandle: '.node-handle', position: nextPosition(), data: { session } }; nodes = [...nodes, node]; }
    showChats = false; focusNode(node);
  }
  function created(id, session) {
    ondraftconsumed();
    sessions = [session, ...sessions.filter((item) => item.id !== session.id)];
    nodes = nodes.map((node) => node.id === id ? { ...node, id: session.id, type: 'project', data: { session } } : node);
    focusNode(nodes.find((node) => node.id === session.id));
    const url = new URL(location.href); url.search = ''; url.searchParams.set('session', session.id); history.replaceState(history.state, '', url);
  }
  function updateSession(session) { sessions = sessions.map((item) => item.id === session.id ? session : item); }
  function closeNode(id) {
    nodes = nodes.filter((node) => node.id !== id);
    const url = new URL(location.href);
    if (url.searchParams.get('session') === id) { url.searchParams.delete('session'); history.replaceState(history.state, '', url); }
  }
</script>
<div class="workspace-board" data-umami-mask>
  <header class="builder-header board-header"><button class="wordmark" onclick={onhome}><img src="/mascot.png" alt="" width="30" height="30" />clank</button><div class="board-title">Your board<span class="cloud-label"><Icon name="cloud" size={14} />Cloud</span></div><nav><button class="quiet-button" onclick={() => showChats = !showChats} aria-expanded={showChats}><Icon name="chat" size={16} />Projects{sessions.length ? ` · ${sessions.length}` : ''}</button><button class="quiet-button" onclick={() => newProject()} aria-label="New project"><Icon name="plus" size={17} /><span class="new-label">New project</span></button><a href="/welcome" class="account-link">Account</a></nav></header>
  {#if showChats}<aside class="project-switcher"><h2>Your projects</h2>{#each sessions as session}<button onclick={() => openSession(session)}><span>{session.title || session.git_ref.display_name || session.prompt}</span><small>{session.status === 'busy' ? 'Working' : 'Open conversation'}</small></button>{:else}<p>Your first project starts with an idea.</p>{/each}</aside>{/if}
  {#if error}<div class="board-banner" role="alert">{error}<button onclick={restore}>Try again</button><a href="/welcome?return_to=%2F%3Fbuild%3D1">Account</a></div>{/if}
  <div class="board-flow"><SvelteFlowProvider><SvelteFlow bind:nodes bind:edges bind:viewport {nodeTypes} colorMode="dark" minZoom={0.25} maxZoom={1.5} panOnScroll zoomOnScroll={false} deleteKey={null} nodesConnectable={false} zoomOnDoubleClick={false}><Background gap={24} size={1} color="#3b3b40" /><Controls orientation="horizontal" showLock={false} /></SvelteFlow></SvelteFlowProvider></div>
  {#if isLoading}<div class="board-status" role="status">Opening your cloud workspace…</div>{:else}<p class="board-hint">Drag the canvas to explore. Drag a project’s header to move it.</p>{/if}
</div>
