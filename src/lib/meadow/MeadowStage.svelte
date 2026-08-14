<script>
  // The hero stage: a stone pixel plinth planted in a grass mound, flanked by
  // mushrooms/flowers/tufts, with a few pollen motes drifting up. The phone
  // showcase renders into the slot above the plinth.
  import { onMount } from 'svelte';
  import { PINK, mulberry, sprite, SPRITES, terrain } from './pixel.js';

  let { children } = $props();

  let groundEl, pollenEl;
  let shroomA, shroomB, flowerA, tuftA, tuftB;

  onMount(() => {
    const mound = terrain({ px: 12, h: 44, minH: 1, maxH: 3, detail: 0.55, seed: 77, w: 384, base: '#7fb069', edge: '#93c47d' });
    groundEl.appendChild(mound.canvas);

    const put = (el, name, s) => el.appendChild(sprite(SPRITES[name].m, SPRITES[name].p, s));
    put(shroomA, 'amanita', 4);
    put(shroomB, 'pinkshroom', 3);
    put(flowerA, 'daisy', 3);
    put(tuftA, 'tuft', 4);
    put(tuftB, 'tuft', 4);

    const R = mulberry(556);
    const COLORS = ['#e2c96f', '#e2c96f', '#efe3ba', '#efe3ba', '#cadfb0', PINK];
    for (let j = 0; j < 6; j++) {
      const p = document.createElement('i');
      const s = R() < 0.7 ? 3 : 4;
      p.className = R() < 0.5 ? 'pol-a' : 'pol-b';
      p.style.width = `${s}px`;
      p.style.height = `${s}px`;
      p.style.background = COLORS[Math.floor(R() * COLORS.length)];
      p.style.left = `${Math.floor(R() * 84 + 8)}%`;
      p.style.bottom = `${Math.floor(R() * 90 + 30)}px`;
      p.style.setProperty('--d', `${8 + Math.floor(R() * 7)}s`);
      p.style.animationDelay = `${-R() * 14}s`;
      pollenEl.appendChild(p);
    }
  });
</script>

<div class="stage">
  <div class="stage-inner">
    <div class="stage-ground" bind:this={groundEl} aria-hidden="true"></div>
    <div class="stage-pollen" bind:this={pollenEl} aria-hidden="true"></div>

    <div class="phone-slot">
      {@render children()}
    </div>

    <div class="plinth" aria-hidden="true">
      <div class="pstep s1"></div>
      <div class="pstep s2"></div>
      <div class="pstep s3"></div>
    </div>
    <span class="stage-spr a" bind:this={shroomA} aria-hidden="true"></span>
    <span class="stage-spr b" bind:this={shroomB} aria-hidden="true"></span>
    <span class="stage-spr c sway" bind:this={flowerA} aria-hidden="true"></span>
    <span class="stage-spr d" bind:this={tuftA} aria-hidden="true"></span>
    <span class="stage-spr e" bind:this={tuftB} aria-hidden="true"></span>
  </div>
</div>

<style>
  .stage {
    position: relative;
    min-width: 0;
    display: flex;
    justify-content: center;
  }
  .stage-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .stage-ground {
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 0;
  }
  .stage-ground :global(canvas),
  .stage-spr :global(canvas) {
    display: block;
    image-rendering: pixelated;
  }
  .stage-pollen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 4;
  }
  .stage-pollen :global(i) {
    position: absolute;
    display: block;
    opacity: 0;
    will-change: transform, opacity;
  }
  .stage-pollen :global(i.pol-a) {
    animation: -global-meadow-pol-a var(--d, 12s) linear infinite;
  }
  .stage-pollen :global(i.pol-b) {
    animation: -global-meadow-pol-b var(--d, 12s) linear infinite;
  }
  .phone-slot {
    position: relative;
    z-index: 3;
    /* clears the phone's blurred contact shadow so it lands on the plinth */
    margin-bottom: 26px;
  }
  .plinth {
    position: relative;
    z-index: 2;
    margin-top: -30px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pstep {
    position: relative;
    border: 1px solid rgba(26, 23, 20, 0.3);
    border-bottom: none;
  }
  /* pixel teeth on each step's top edge */
  .pstep::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 5px;
    right: 5px;
    height: 6px;
    background: repeating-linear-gradient(90deg, var(--tooth, #c9c1ab) 0 6px, transparent 6px 12px);
  }
  .pstep.s1 {
    width: 190px;
    height: 16px;
    background: #e5decb;
    --tooth: #d6cfb9;
  }
  .pstep.s2 {
    width: 246px;
    height: 20px;
    background: #d6cfba;
    --tooth: #c6bda6;
  }
  .pstep.s3 {
    width: 306px;
    height: 26px;
    background: #c6bda6;
    --tooth: #b4aa91;
    border-bottom: 1px solid rgba(26, 23, 20, 0.3);
    background-image:
      repeating-linear-gradient(90deg, rgba(26, 23, 20, 0.07) 0 2px, transparent 2px 26px),
      repeating-linear-gradient(0deg, rgba(26, 23, 20, 0.05) 0 2px, transparent 2px 12px);
  }
  .stage-spr {
    position: absolute;
    z-index: 3;
    transform-origin: bottom center;
  }
  .stage-spr.a {
    left: calc(50% - 200px);
    bottom: -4px;
  }
  .stage-spr.b {
    right: calc(50% - 186px);
    bottom: -6px;
  }
  .stage-spr.c {
    left: calc(50% - 246px);
    bottom: -6px;
  }
  .stage-spr.d {
    left: calc(50% - 152px);
    bottom: -10px;
  }
  .stage-spr.e {
    right: calc(50% - 148px);
    bottom: -10px;
  }
  .sway {
    animation: sway 5.5s ease-in-out infinite;
  }
  @keyframes sway {
    0%,
    100% {
      transform: rotate(0);
    }
    50% {
      transform: rotate(2.5deg);
    }
  }
  @media (max-width: 620px) {
    .stage-inner {
      transform: scale(0.82);
      transform-origin: bottom center;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sway,
    .stage-pollen :global(i) {
      animation: none !important;
    }
  }
</style>
