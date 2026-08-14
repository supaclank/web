<script>
  // The hero stage: the phone showcase with a few pollen motes drifting up.
  import { onMount } from 'svelte';
  import { PINK, mulberry } from './pixel.js';

  let { children } = $props();

  let pollenEl;

  onMount(() => {
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
  @media (max-width: 620px) {
    .stage-inner {
      transform: scale(0.82);
      transform-origin: bottom center;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .stage-pollen :global(i) {
      animation: none !important;
    }
  }
</style>
