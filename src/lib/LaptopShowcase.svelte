<script>
  import { onMount } from 'svelte';

  // The window opens straight onto the user's existing Acme site; clank just
  // makes live edits to it. We loop between two prompted edits that toggle the
  // CTA colour, so every change on screen is explained by a spoken prompt.
  const edits = [
    { prompt: 'make the CTA button green', reply: 'CTA is green now — live.', edited: true },
    { prompt: 'change it back to pink', reply: 'Reverted to pink — live.', edited: false }
  ];

  const BARS = 32;
  const PITCH = 5;
  const BAR_MS = 85;
  const QUIET = 0.05;

  let boxVisible = $state(false);
  let typed = $state('');
  let recording = $state(false);
  let working = $state(false);
  let doneReply = $state('');
  let sending = $state(false);
  let edited = $state(false);
  let reloading = $state(false);
  let editIndex = $state(0);
  let nextBarId = 0;
  const makeBar = (level) => ({ id: nextBarId++, level });
  let bars = $state(Array.from({ length: BARS }, () => makeBar(QUIET)));
  let waveOffset = $state(0);
  let reduceMotion = $state(false);

  let alive = true;
  let timer;
  let rafId;

  let stageEl;
  let active = true;
  let resumeGate = null;
  const gate = () => (active ? Promise.resolve() : new Promise((r) => (resumeGate = r)));
  function setActive(v) {
    if (v === active) return;
    active = v;
    if (v && resumeGate) {
      resumeGate();
      resumeGate = null;
    }
  }

  let resolveSleep = null;
  const sleep = (ms) =>
    new Promise((resolve) => {
      if (!alive) return resolve();
      resolveSleep = resolve;
      timer = setTimeout(() => {
        resolveSleep = null;
        resolve();
      }, ms);
    });

  async function voicePrompt(text) {
    recording = true;
    typed = '';
    bars = Array.from({ length: BARS }, () => makeBar(QUIET));
    waveOffset = 0;

    let w1 = 0, w2 = 0, w3 = 0;
    const nextSample = () => {
      w1 += (Math.random() - 0.5) * 0.9; w1 -= w1 * 0.08;
      w2 += (Math.random() - 0.5) * 0.6; w2 -= w2 * 0.04;
      w3 += (Math.random() - 0.5) * 0.35; w3 -= w3 * 0.02;
      const v = (Math.abs(w1 + w2 + w3) * 0.7) % 1;
      return 0.05 + v * 0.9;
    };

    cancelAnimationFrame(rafId);
    let last = 0;
    const frame = (t) => {
      if (!alive || !recording) return;
      if (active && last && t - last < 500) {
        waveOffset += (PITCH / BAR_MS) * (t - last);
        while (waveOffset >= PITCH) {
          waveOffset -= PITCH;
          bars = [...bars.slice(1), makeBar(nextSample())];
        }
      }
      last = active ? t : 0;
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    await sleep(800);
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (!alive) break;
      typed = words.slice(0, i + 1).join(' ');
      await sleep(200 + Math.random() * 180);
    }
    await sleep(900);
    recording = false;
    cancelAnimationFrame(rafId);
  }

  async function run() {
    await sleep(1300);
    while (alive) {
      await gate();
      if (!alive) break;
      const edit = edits[editIndex];

      boxVisible = true;
      await sleep(1100);

      await voicePrompt(edit.prompt);
      await sleep(700);

      sending = true;
      await sleep(260);
      sending = false;
      typed = '';
      working = true;
      await sleep(1400);

      reloading = true;
      await sleep(220);
      edited = edit.edited;
      await sleep(80);
      reloading = false;
      working = false;
      doneReply = edit.reply;
      await sleep(2600);

      doneReply = '';
      boxVisible = false;
      await sleep(500);
      typed = '';
      recording = false;
      working = false;
      editIndex = (editIndex + 1) % edits.length;
      await sleep(1100);
    }
  }

  onMount(() => {
    reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduceMotion) {
      boxVisible = true;
      doneReply = edits[0].reply;
      return;
    }
    run();
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0 }
    );
    if (stageEl) io.observe(stageEl);
    return () => {
      alive = false;
      io.disconnect();
      clearTimeout(timer);
      if (resolveSleep) resolveSleep();
      cancelAnimationFrame(rafId);
      if (resumeGate) resumeGate();
    };
  });

  let showSubmit = $derived(typed.length > 0 && !recording && !working);
</script>

<div
  bind:this={stageEl}
  class="laptop-stage"
  aria-hidden="true"
  role="presentation"
>
  <div class="absolute top-1/2 left-1/2 -z-10 h-96 w-96 max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-dim blur-3xl"></div>

  <div class="live-chip">
    <span class="relative flex h-2 w-2">
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
      <span class="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
    </span>
    Live preview
  </div>

  <div class="window">
    <div class="titlebar">
      <div class="dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="address">
        <span class="lock">🔒</span>
        <span class="url">localhost:5173</span>
      </div>
      <div class="titlebar-spacer"></div>
    </div>
    <div class="browser-viewport">
              {#key edited}
                <div class="app-screen">
                  {@render landingApp()}
                </div>
              {/key}

              {#if reloading}
                <div class="reload-banner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" />
                  </svg>
                  Refreshing…
                </div>
              {/if}

              <div class="prompt-wrap" class:show={boxVisible}>
                <div class="prompt-box" class:working>
                  <div class="glow"></div>
                  <div class="box-inner">
                    <div class="done-section" class:open={!!doneReply}>
                      <div class="done-clip">
                        <div class="done-row">
                          <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                          <span class="done-text">{doneReply}</span>
                        </div>
                        <div class="divider"></div>
                      </div>
                    </div>

                    <div class="prompt-body">
                      <div class="prompt-top">
                        <div class="prompt-text">
                          {#if working}
                            <span class="muted">Working…</span>
                          {:else if recording || typed}
                            <span class="ink">{typed}</span>{#if recording}<span class="caret">|</span>{/if}
                          {:else}
                            <span class="ph">Ask anything…</span>
                          {/if}
                        </div>
                      </div>

                      <div class="wave-section" class:open={recording}>
                        <div class="wave-clip">
                          <div class="wave">
                            <div class="wave-strip" style="transform: translateX(-{waveOffset}px)">
                              {#each bars as bar (bar.id)}
                                <div class="bar-slot">
                                  <div class="bar" style="height: {Math.max(3, bar.level * 32)}px"></div>
                                </div>
                              {/each}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="prompt-bar">
                        <div class="spacer"></div>
                        <div class="actions">
                          <div class="circle send" class:pressed={sending} style="opacity: {showSubmit ? 1 : 0}">
                            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="M50 75 L50 25" /><path d="M30 45 L50 25 L70 45" />
                            </svg>
                          </div>
                          <div class="circle mic" style="transform: translateX({showSubmit ? '-30px' : '0px'}); background: {recording ? '#d9534f' : working ? '#424242' : 'rgba(117, 117, 117, 0.4)'}">
                            {#if recording || working}
                              <div class="stop"></div>
                            {:else}
                              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <rect x="35" y="15" width="30" height="40" rx="15" />
                                <path d="M25 55 C25 78 75 78 75 55" />
                                <path d="M50 78 L50 90" /><path d="M32 90 L68 90" />
                              </svg>
                            {/if}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  </div>
</div>

{#snippet landingApp()}
  <div class="flex h-full w-full flex-col bg-white">
    <div class="flex items-center justify-between border-b border-zinc-100 px-4 py-2">
      <span class="text-xs font-bold text-zinc-800">Acme</span>
      <div class="flex gap-2">
        <div class="h-4 w-8 rounded bg-zinc-100"></div>
        <div class="h-4 w-8 rounded bg-zinc-100"></div>
      </div>
    </div>
    <div class="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div class="mb-2 h-8 w-32 rounded bg-zinc-100"></div>
      <h3 class="text-lg font-bold text-zinc-800">Build faster</h3>
      <p class="mt-1 text-[10px] text-zinc-400">Ship products in record time</p>
      <div class="mt-3 h-6 w-20 rounded-full {edited ? 'bg-emerald-500' : 'bg-brand'}"></div>
    </div>
    <div class="grid grid-cols-3 gap-2 border-t border-zinc-100 p-3">
      {#each [1, 2, 3]}
        <div class="rounded-lg bg-zinc-50 p-2 text-center">
          <div class="mx-auto mb-1 h-6 w-6 rounded-full bg-zinc-200"></div>
          <div class="mx-auto h-2 w-12 rounded bg-zinc-200"></div>
        </div>
      {/each}
    </div>
  </div>
{/snippet}

<style>
  .laptop-stage {
    position: relative;
    /* Own stacking context so the prompt box / live chip (z 20–40) can't paint
       above the sticky page header (z 10) when it scrolls over this section. */
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .live-chip {
    position: absolute;
    top: -14px;
    right: 14px;
    z-index: 40;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border-radius: 9999px;
    border: 1px solid var(--color-line);
    background: var(--color-elevated);
    padding: 0.35rem 0.75rem;
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--color-ink);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  /* Flat, straight-on macOS-style browser window. Fluid width (not a fixed
     560px) so its intrinsic size can't blow up an ancestor grid track and
     push the page past the viewport on small screens. */
  .window {
    position: relative;
    width: 100%;
    max-width: 560px;
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    box-shadow:
      0 22px 50px -18px rgba(0, 0, 0, 0.28),
      0 0 0 1px rgba(0, 0, 0, 0.05);
  }

  .titlebar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    background: #f6f6f7;
    border-bottom: 1px solid #ececed;
  }

  .dots {
    display: flex;
    gap: 7px;
    flex-shrink: 0;
    width: 47px;
  }

  .dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
  }

  .dot.red {
    background: #ff5f57;
  }

  .dot.yellow {
    background: #febc2e;
  }

  .dot.green {
    background: #28c840;
  }

  .address {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    margin: 0 auto;
    padding: 3px 14px;
    border-radius: 7px;
    background: #ffffff;
    border: 1px solid #e6e6e7;
    font-size: 11px;
    color: #8a9094;
  }

  .titlebar-spacer {
    width: 47px;
    flex-shrink: 0;
  }

  .lock {
    font-size: 9px;
  }

  .browser-viewport {
    position: relative;
    height: 360px;
    overflow: hidden;
  }

  .app-screen {
    height: 100%;
  }

  .reload-banner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 20px;
    background: #fa5573;
    color: #ffffff;
    font-size: 10px;
    font-weight: 600;
  }

  .reload-banner svg {
    width: 12px;
    height: 12px;
  }

  /* Design width is 220px; the whole box is uniformly scaled down (~0.73) so it
     reads at ~1/3.5 of the 560px screen — proportional to a real prompt box —
     while keeping text, waveform and buttons in proportion. */
  .prompt-wrap {
    position: absolute;
    left: 50%;
    bottom: 16%;
    z-index: 20;
    width: 220px;
    transform-origin: bottom center;
    transform: translateX(-50%) translateY(42px) scale(0.669);
    opacity: 0;
    transition:
      opacity 0.35s ease,
      transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .prompt-wrap.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(0.727);
  }

  .prompt-box {
    position: relative;
    width: 100%;
  }

  .glow {
    position: absolute;
    inset: -2px;
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .prompt-box.working .glow {
    opacity: 1;
  }

  .glow::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 240%;
    aspect-ratio: 1;
    border-radius: 50%;
    transform: translate(-50%, -50%) rotate(0deg);
    background: conic-gradient(
      rgba(255, 110, 32, 0) 0deg,
      rgba(255, 110, 32, 0) 205deg,
      rgba(255, 150, 90, 0.45) 290deg,
      #ff6e20 338deg,
      rgba(255, 110, 32, 0) 360deg
    );
    filter: blur(1px);
    animation: glow-rot 2s linear infinite;
  }

  @keyframes glow-rot {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  .box-inner {
    position: relative;
    z-index: 1;
    overflow: hidden;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    transition: box-shadow 0.3s ease;
  }

  .prompt-box.working .box-inner {
    box-shadow:
      0 2px 12px rgba(0, 0, 0, 0.12),
      0 0 14px rgba(255, 110, 32, 0.22);
  }

  .done-section {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.24s ease;
  }

  .done-section.open {
    grid-template-rows: 1fr;
  }

  .done-clip {
    overflow: hidden;
    min-height: 0;
    opacity: 0;
    transition: opacity 0.2s ease 0.04s;
  }

  .done-section.open .done-clip {
    opacity: 1;
  }

  .done-row {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 10px 12px 8px;
  }

  .check {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    margin-top: 1px;
    color: #22c55e;
  }

  .done-text {
    font-size: 11px;
    line-height: 1.35;
    color: #1f1f23;
  }

  .divider {
    width: 100%;
    height: 1px;
    background: #eee;
  }

  .prompt-body {
    padding: 10px 12px;
  }

  .prompt-top {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  .prompt-text {
    flex: 1;
    min-width: 0;
    min-height: 1.3em;
    font-size: 11px;
    line-height: 1.45;
  }

  .prompt-text .ph {
    color: #bdbdbd;
  }

  .prompt-text .muted {
    color: #9e9e9e;
  }

  .prompt-text .ink {
    color: #0f0f0f;
  }

  .caret {
    color: #9e9e9e;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  .wave-section {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease;
  }

  .wave-section.open {
    grid-template-rows: 1fr;
  }

  .wave-clip {
    overflow: hidden;
    min-height: 0;
  }

  .wave {
    overflow: hidden;
    height: 36px;
    margin-top: 8px;
  }

  .wave-strip {
    display: flex;
    align-items: center;
    height: 100%;
    will-change: transform;
  }

  .bar-slot {
    width: 5px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bar {
    width: 3px;
    border-radius: 9999px;
    background: #424242;
    transform-origin: center;
  }

  .prompt-bar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }

  .spacer {
    flex: 1;
  }

  .actions {
    position: relative;
    z-index: 1;
    height: 24px;
    width: 56px;
    flex-shrink: 0;
  }

  .circle {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    height: 24px;
    width: 24px;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
  }

  .circle svg {
    width: 12px;
    height: 12px;
  }

  .mic {
    color: #ffffff;
    transition:
      transform 0.18s ease,
      background 0.2s ease;
  }

  .stop {
    height: 8px;
    width: 8px;
    border-radius: 2px;
    background: #ffffff;
  }

  .send {
    background: #424242;
    color: #ffffff;
    transition:
      opacity 0.18s ease,
      transform 0.12s ease;
  }

  .send.pressed {
    transform: scale(0.86);
  }

  @media (max-width: 640px) {
    .browser-viewport {
      height: 300px;
    }
  }
</style>