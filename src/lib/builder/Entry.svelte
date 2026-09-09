<script>
  import { onMount, onDestroy, untrack } from 'svelte';
  import Landing from './Landing.svelte';
  import { ClankGateway } from '../clank-gateway.js';
  import { loadDraft, storeDraft } from './model.js';
  import './builder.css';
  let { startOnBoard = false } = $props();
  let showBoard = $state(untrack(() => startOnBoard));
  let shouldAutoStart = $state(false);
  let Board = $state(null);
  let draft = $state(null);
  let user = $state(null);
  let gateway = $state(null);
  let supabase = $state(null);
  let error = $state('');
  let subscription;
  let isAlive = true;
  onDestroy(() => { isAlive = false; subscription?.unsubscribe(); });
  async function revealBoard() { showBoard = true; const module = await import('./Board.svelte'); if (isAlive) Board = module.default; }
  onMount(() => { void initialize(); });
  async function initialize() {
    try {
      try { draft = loadDraft(localStorage); }
      catch { error = 'Your saved idea couldn’t be restored. You can still open your projects or start a new idea.'; }
      const query = new URLSearchParams(location.search);
      shouldAutoStart = query.has('build');
      if (startOnBoard || query.has('build') || query.has('session')) void revealBoard();
      const [{ createSupabase }, { GATEWAY_URL }] = await Promise.all([import('../supabase.js'), import('../config.js')]);
      supabase = createSupabase();
      function receiveSession(session, event) {
        if (!isAlive) return;
        if (session) { user = session.user; if (gateway) gateway.accessToken = session.access_token; else gateway = new ClankGateway(GATEWAY_URL, session.access_token); if (event !== 'TOKEN_REFRESHED') void revealBoard(); }
        else { user = null; gateway = null; }
      }
      const { data } = supabase.auth.onAuthStateChange((_event, session) => receiveSession(session, _event)); subscription = data.subscription;
      const result = await supabase.auth.getSession(); if (result.error) throw result.error; receiveSession(result.data.session);
    } catch (cause) { error = cause.message; }
  }
  async function start(value) {
    error = '';
    if (value) { try { storeDraft(localStorage, value); draft = value; shouldAutoStart = true; } catch (cause) { error = `Your idea couldn’t be saved: ${cause.message}`; return; } }
    await revealBoard();
  }
</script>
<svelte:head><title>Clank — Make websites and mobile apps with AI</title><meta name="description" content="Turn your ideas into websites and native mobile apps on one canvas. Build with an agent, see a live preview, and keep your code. Open source. Free locally." /><meta name="theme-color" content="#141416" /></svelte:head>
<div class="clank-builder">{#if showBoard}{#if Board}{#key user?.id}<Board {gateway} {supabase} {user} {draft} {shouldAutoStart} ondraftconsumed={() => { draft = null; shouldAutoStart = false; }} onhome={() => showBoard = false} />{/key}{:else}<div class="opening-board" role="status">Opening your board…</div>{/if}{:else}<Landing onstart={start} />{/if}{#if error}<div class="entry-error" role="alert">{error}<button onclick={() => location.reload()}>Reload</button></div>{/if}</div>
