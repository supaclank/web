<script>
  import { onMount, onDestroy, tick, untrack } from 'svelte';
  import { SvelteFlow, SvelteFlowProvider, Background } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { demoNodes, demoEdges, demoViewport, DEMO_NODE, DEMO_EDGE, DEMO_PHASE, DEMO_PORT, WORKTREE_MODE } from './model.js';
  import { presentDemoGraph } from './presentation.js';
  import { newClankRequest } from './sessions.js';
  import { sessionFromPort, canConnectSession, connectSession, runDemoSession, updateSessionPhase } from './worktrees.js';
  import Connections from './Connections.svelte';
  import NodeActions from './NodeActions.svelte';
  import { workStep, LAST_WORK_STEP } from './progress.js';
  import { cursorViewport, FOLLOW_TOLERANCE } from './follow.js';
  import Icon from '../Icon.svelte';
  import DemoEdge from './DemoEdge.svelte';
  import CanvasMenu from '../CanvasMenu.svelte';
  import Viewport from './Viewport.svelte';
  import Cursor from './Cursor.svelte';
  import Assistant from './Assistant.svelte';
  import RepositoryNode from './RepositoryNode.svelte';
  import AgentNode from './AgentNode.svelte';
  import CodeNode from './CodeNode.svelte';
  import PreviewNode from './PreviewNode.svelte';
  let { phase, step, variant, scriptedPrompt, isScripted, canAnimate, cursor, isPreviewClicked, oninteract, onphase } = $props();
  let contextMenu = $state(null);
  let connections = $state(null);
  let nodeActions = $state(null);
  let notice = $state('');
  let pendingPromptId = $state(null);
  let root = $state(null);
  let assistant = $state(null);
  let isFollowing = $state(false);
  let cursorPosition = null;
  let viewport = $state({ x: 0, y: 0, zoom: 1 });
  const initialGraph = untrack(() => presentDemoGraph(demoNodes(phase), demoEdges(phase)));
  let nodes = $state.raw(initialGraph.nodes.map(withActions));
  let edges = $state.raw(initialGraph.edges);
  let activeId = $state(DEMO_NODE.agent);
  let viewportController = $state(null);
  let isInitialized = $state(false);
  let runningCount = $state(0);
  let sessions = $derived(nodes.filter(node => node.type === DEMO_NODE.agent));
  let requests = $derived(nodes.filter((node) => node.data.isClankRequest).map(({ id, data }) => ({ id, prompt: data.turns.length ? data.turns[0].prompt : data.prompt, phase: data.phase })));
  let isClankWorking = $derived(runningCount > 0 || (isScripted && !cursor.isComplete));
  const timers = new Map();
  $effect(() => { const selected = variant; untrack(() => { nodes = nodes.map(node => ({ ...node, data: { ...node.data, variant: selected } })); }); });
  const nodeTypes = { repository: RepositoryNode, agent: AgentNode, code: CodeNode, preview: PreviewNode };
  const edgeTypes = { [DEMO_EDGE]: DemoEdge };
  function withActions(node) { return { ...node, data: { ...node.data, onedit: edit, onsubmit: submit, oninteract: interact, onbranch: branch, onopen: openSession, variant } }; }
  function interact() { isFollowing = false; oninteract(); }
  function followClank() { isFollowing = true; centerCursor(); }
  function trackCursor(point) { cursorPosition = point; if (isFollowing) centerCursor(); }
  function centerCursor() {
    if (!cursorPosition) return;
    const next = cursorViewport(cursorPosition, root.getBoundingClientRect(), viewport.zoom);
    if (Math.abs(next.x - viewport.x) > FOLLOW_TOLERANCE || Math.abs(next.y - viewport.y) > FOLLOW_TOLERANCE) void viewportController.focus(next);
  }
  function moveStart(event) { contextMenu.close(); if (event) isFollowing = false; }
  function applyGraph(graph) { const presented = presentDemoGraph(graph.nodes, graph.edges); nodes = presented.nodes.map(withActions); edges = presented.edges; }
  function updateSession(id, data) { applyGraph(updateSessionPhase(nodes, edges, id, data)); }
  function connect(connection) {
    try { const graph = connectSession(connection, nodes, edges); interact(); applyGraph(graph); notice = ''; }
    catch (cause) { notice = cause.message; }
  }
  function selectNode(id) {
    isFollowing = false;
    nodes = nodes.map(node => ({ ...node, selected: node.id === id }));
    const node = nodes.find(node => node.id === id);
    if (node.type === DEMO_NODE.agent && node.data.phase !== DEMO_PHASE.prompt) openSession(id);
  }
  function openSession(id) { isFollowing = false; activeId = id; assistant.openSession(id); }
  function continueSession(id, prompt) {
    const node = nodes.find(node => node.id === id);
    if (node.data.phase !== DEMO_PHASE.ready) throw new Error('Wait for the current work to finish.');
    const draft = { ...node, data: { ...node.data, phase: DEMO_PHASE.prompt, worktreeMode: WORKTREE_MODE.reuse, isScripted: false, prompt: prompt.trim(), turns: [...node.data.turns, { prompt: node.data.prompt, step: LAST_WORK_STEP }] } };
    const prepared = nodes.map(node => node.id === id ? draft : node);
    const graph = runDemoSession(draft, prepared, edges);
    interact(); applyGraph(graph); start(id);
  }
  function branch(id, port) {
    const source = nodes.find((node) => node.id === id);
    const position = port === DEMO_PORT.worktree ? { x: source.position.x - 380, y: source.position.y + 300 } : { x: source.position.x, y: source.position.y + 340 };
    void create(position, id, port);
  }
  $effect(() => {
    if (!isScripted) return;
    const data = { phase, step, prompt: scriptedPrompt, isPreviewClicked };
    untrack(() => updateSession(DEMO_NODE.agent, data));
  });
  $effect(() => {
    if (isInitialized && root && viewportController) untrack(() => { void focus(DEMO_NODE.agent); });
  });
  export function focus(target) {
    isFollowing = false;
    const { width, height } = root.getBoundingClientRect();
    const agent = nodes.find((node) => node.id === activeId);
    if (!agent) { notice = 'Select a session to view it, or replay the example.'; return; }
    const viewport = demoViewport(width, height, target);
    if (target === DEMO_NODE.preview) {
      const preview = nodes.find((node) => node.type === DEMO_NODE.preview && node.data.worktreeId === agent.data.worktreeId);
      if (!preview || preview.hidden) { notice = 'This session has no preview on the canvas yet.'; return; }
      viewport.x -= preview.position.x - 890;
      viewport.y -= preview.position.y;
    } else {
      viewport.x -= (agent.position.x - 226) * viewport.zoom;
      viewport.y -= (agent.position.y - 34) * viewport.zoom;
    }
    return viewportController.focus(viewport);
  }
  export function replay() {
    const original = nodes.find((node) => node.id === DEMO_NODE.code);
    if (original?.data.activeSessionId && original.data.activeSessionId !== DEMO_NODE.agent) {
      notice = 'A session is editing the example worktree. Replay is available when it finishes.';
      return false;
    }
    const present = new Set(nodes.map(node => node.id));
    nodes = [...nodes, ...demoNodes(DEMO_PHASE.prompt).filter(node => !present.has(node.id)).map(withActions)];
    const edgeIds = new Set(edges.map(edge => edge.id));
    edges = [...edges, ...demoEdges(DEMO_PHASE.prompt).filter(edge => !edgeIds.has(edge.id))];
    notice = '';
    updateSession(DEMO_NODE.agent, { phase: DEMO_PHASE.prompt, step: 0, activeSessionId: null, hasStarted: false });
    if (timers.has(DEMO_NODE.agent)) { clearTimeout(timers.get(DEMO_NODE.agent)); timers.delete(DEMO_NODE.agent); runningCount -= 1; }
    activeId = DEMO_NODE.agent;
    nodes = nodes.map((node) => node.id === activeId ? withActions({ ...node, data: { ...node.data, isScripted: true } }) : node);
    if (!isFollowing) void focus(DEMO_NODE.agent);
    return true;
  }
  async function create(position, sourceId = DEMO_NODE.repository, port = DEMO_PORT.repository) {
    try {
      const source = nodes.find((node) => node.id === sourceId);
      const result = sessionFromPort(crypto.randomUUID(), position, source, port);
      interact();
      const node = withActions(result.node);
      nodes = [...nodes, node]; edges = [...edges, result.edge]; activeId = node.id; onphase(DEMO_PHASE.prompt); notice = '';
      pendingPromptId = node.id;
    } catch (cause) { notice = cause.message; }
  }
  $effect(() => {
    const id = pendingPromptId;
    const node = nodes.find((node) => node.id === id);
    if (!node?.measured?.width || !node.measured.height) return;
    pendingPromptId = null;
    untrack(async () => {
      await tick();
      root.querySelector(`[data-id="${id}"] textarea`).focus({ preventScroll: true });
    });
  });
  function edit(id, prompt) {
    interact(); activeId = id;
    nodes = nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, prompt } } : node);
    onphase(DEMO_PHASE.prompt);
  }
  function submit(id) {
    try {
      const node = nodes.find((node) => node.id === id);
      const graph = runDemoSession(node, nodes, edges);
      interact(); applyGraph(graph); notice = ''; start(id);
    } catch (cause) { notice = cause.message; }
  }
  function start(id) {
    interact(); activeId = id; onphase(DEMO_PHASE.reading); runningCount += 1;
    advance(id, 0);
  }
  function request(prompt) {
    const id = crypto.randomUUID();
    const result = newClankRequest(id, prompt, nodes);
    applyGraph({ nodes: [...nodes, result.agent, ...result.nodes], edges: [...edges, ...result.edges] });
    start(id);
  }
  function show(id, target) {
    interact(); activeId = id;
    onphase(nodes.find((node) => node.id === id).data.phase);
    void focus(target);
  }
  function advance(id, current) {
    timers.set(id, setTimeout(() => {
      const next = current + 1;
      const activity = workStep(next);
      updateSession(id, { phase: activity.phase, step: next });
      if (activeId === id) onphase(activity.phase);
      if (next === LAST_WORK_STEP) { timers.delete(id); runningCount -= 1; }
      else advance(id, next);
    }, workStep(current).duration));
  }
  onDestroy(() => { for (const timer of timers.values()) clearTimeout(timer); });
  onMount(() => {
    const observer = new ResizeObserver(() => {
      if (!isInitialized) return;
      if (isFollowing) centerCursor();
    });
    observer.observe(root);
    return () => observer.disconnect();
  });
</script>
<div class="demo-workspace">
  <div class="demo-flow" class:demo-running={runningCount > 0 && canAnimate} bind:this={root}>
    <SvelteFlowProvider><SvelteFlow tabindex={0} aria-label="Example workspace canvas" aria-keyshortcuts="Shift+F10" onkeydown={(event) => contextMenu.keyboard(event)} onpanecontextmenu={(event) => contextMenu.open(event)} onmovestart={moveStart} onnodedragstart={() => isFollowing = false} bind:nodes bind:edges bind:viewport onnodeclick={(event) => nodeActions.select(event)} onconnectstart={interact} onbeforeconnect={(connection) => { connect(connection); return null; }} onconnectend={(event, state) => connections.end(event, state)} isValidConnection={(connection) => canConnectSession(connection, nodes)} oninit={() => { isInitialized = true; }} {nodeTypes} {edgeTypes} colorMode="dark" minZoom={0.4} maxZoom={1.4} nodesConnectable={true} deleteKey={null} zoomOnScroll={false} zoomOnDoubleClick={false} preventScrolling={false} panOnDrag selectionOnDrag={false} autoPanOnNodeFocus={false}><CanvasMenu bind:this={contextMenu} canvas={root} oncreate={create} /><Viewport bind:this={viewportController} /><Connections bind:this={connections} oncreate={create} /><Background gap={20} size={1} color="#353535" /></SvelteFlow></SvelteFlowProvider>
    {#if isFollowing}<button type="button" class="demo-follow-mode" aria-label="Stop following Clank" onclick={() => isFollowing = false}>Following Clank<Icon name="close" size={13} /></button>{/if}
    {#if cursor && root && isInitialized}<Cursor {root} frame={cursor} {viewport} {nodes} {isScripted} isWorking={isClankWorking} onposition={trackCursor} onopen={() => assistant.open()} />{/if}
  </div>
  <NodeActions bind:this={nodeActions} onselect={selectNode} />
  <Assistant bind:this={assistant} {requests} {sessions} oncontinue={continueSession} isReady={isInitialized} isWorking={isClankWorking} onopen={followClank} onrequest={request} onshow={show} />
  {#if notice}<div class="demo-graph-notice" role="alert">{notice}<button type="button" aria-label="Dismiss notice" onclick={() => notice = ''}><Icon name="close" size={14} /></button></div>{/if}
</div>
