<script>
  // The hero stage: the phone showcase flanked by mushrooms/flowers/tufts,
  // with a few pollen motes drifting up.
  import { onMount } from 'svelte';
  import { PINK, mulberry, sprite, SPRITES } from './pixel.js';

  let { children } = $props();

  let pollenEl;
  let shroomA, shroomB, flowerA, tuftA, tuftB;

  onMount(() => {
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
    <div class="stage-pollen" bind:this={pollenEl} aria-hidden="true"></div>

    <div class="phone-slot">
      {@render children()}
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
    /* clears the phone's blurred contact shadow so it lands on the grass */
    margin-bottom: 40px;
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
