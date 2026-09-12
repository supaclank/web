<script>
  import { onMount, untrack } from 'svelte';
  import { observeMotion } from '../motion.js';
  import { DEMO_PHASE, DEMO_NODE, DEMO_STATUS } from './model.js';
  import { playbackFrame, nextPlaybackStep, PLAYBACK } from './playback.js';
  import Icon from '../Icon.svelte';
  import DesignControls from './DesignControls.svelte';
  import { SESSION_VIEW } from './session-views.js';
  import { WORK_STEPS } from './progress.js';
  import './demo.css';
  let root;
  let variant = $state(SESSION_VIEW.prompt);
  let isDesigning = $state(false);
  onMount(() => {
    isDesigning = import.meta.env.DEV && new URLSearchParams(location.search).get('design') === 'session-progress';
    if (isDesigning) { isPlaying = false; elapsed = PLAYBACK.editing + 1200; }
  });
  function nextAction() {
    let time = PLAYBACK.submit;
    const times = WORK_STEPS.map(step => { const start = time; time += step.duration; return start; });
    elapsed = times.find(time => time > elapsed) ?? PLAYBACK.submit;
    isPlaying = false; isScripted = true;
  }
  let board = $state(null);
  let Board = $state(null);
  let isLoading = false;
  let error = $state('');
  let elapsed = $state(0);
  let replayVersion = $state(0);
  let isScripted = $state(true);
  let manualPhase = $state(DEMO_PHASE.prompt);
  let frame = $derived(playbackFrame(elapsed));
  let phase = $derived(isScripted ? frame.phase : manualPhase);
  let isPlaying = $state(true);
  let canAnimate = $state(false);
  let isReduced = $state(false);
  async function load() {
    if (Board || isLoading) return;
    isLoading = true; error = '';
    try { Board = (await import('./DemoBoard.svelte')).default; }
    catch { error = 'The demo couldn’t load.'; }
    finally { isLoading = false; }
  }
  onMount(() => observeMotion(root, (state) => {
    canAnimate = state.canAnimate; isReduced = state.isReduced;
    if (isReduced) isPlaying = false;
    if (state.isVisible) void load();
  }));
  $effect(() => {
    const version = replayVersion;
    if (!Board || !canAnimate || !isPlaying || !isScripted) return;
    let previous = null, request;
    function animate(time) {
      if (version !== untrack(() => replayVersion)) return;
      if (previous !== null) elapsed = Math.min(PLAYBACK.end, untrack(() => elapsed) + time - previous);
      previous = time;
      if (untrack(() => elapsed) < PLAYBACK.end) request = requestAnimationFrame(animate);
    }
    request = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(request);
  });
  function interact() { manualPhase = phase; isScripted = false; isPlaying = false; }
  function replay() { if (board && board.replay() === false) return; replayVersion += 1; elapsed = 0; isScripted = true; isPlaying = !isReduced; }

</script>
<section class="landing-demo" aria-labelledby="demo-title" bind:this={root}>
  <div class="demo-heading"><div><h2 id="demo-title">Watch an idea become an app.</h2><p>A conversation, a working copy, a preview. All on your canvas.</p></div><span>Interactive demo</span></div>
  {#if isDesigning}<DesignControls bind:variant onstep={nextAction} />{/if}
  <div class="demo-browser" class:demo-running={canAnimate && isPlaying && !frame.isComplete}>
    <header class="demo-browser-bar"><span class="demo-window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="demo-browser-location"><Icon name="cloud" size={13} />clank / daily</span><button type="button" onclick={replay} aria-label="Replay demo"><Icon name="refresh" size={14} /><span>Replay</span></button></header>
    {#if Board}<Board bind:this={board} {canAnimate} {isScripted} phase={frame.phase} step={frame.step} {variant} scriptedPrompt={frame.prompt} isPreviewClicked={isScripted && !isReduced && frame.isPreviewClicked} cursor={frame} oninteract={interact} onphase={(value) => manualPhase = value} />{:else}<div class="demo-placeholder">{#if error}<p role="alert">{error}</p><button type="button" class="text-button" onclick={load}>Try again</button>{:else}<p>Loading the example workspace…</p>{/if}</div>{/if}
    <footer class="demo-controls"><span class="demo-caption" role="status">{!isScripted && phase === DEMO_PHASE.prompt ? 'Write a prompt, then run the example.' : DEMO_STATUS[phase]}</span><div>
      {#if isReduced && isScripted}<button type="button" onclick={() => elapsed = nextPlaybackStep(elapsed)} disabled={!Board || phase === DEMO_PHASE.ready}>Next step<Icon name="arrow" size={13} /></button>
      {:else if isScripted && !frame.isComplete}<button type="button" disabled={!Board} onclick={() => isPlaying = !isPlaying}>{isPlaying ? 'Pause demo' : 'Play demo'}</button>{/if}
      <button type="button" onclick={() => board?.focus(DEMO_NODE.agent)} disabled={!Board}>Reset view</button><button type="button" onclick={() => board?.focus(DEMO_NODE.preview)} disabled={!Board || phase !== DEMO_PHASE.ready}>View preview<Icon name="external" size={12} /></button>
    </div></footer>
  </div>
  <p class="demo-note">Drag from a repository or Fork port for a new session. Connect its output to a code node to share that worktree. This example is scripted: every prompt builds the same habit tracker.</p>
</section>
