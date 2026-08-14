<script>
  // The living pixel world behind every marketing page: fixed sky (dithered
  // sun + drifting clouds), three parallax meadow layers pinned to the
  // viewport bottom, pollen motes, and a whisper of grain. Decorative only —
  // all aria-hidden, pointer-events none, transform/opacity animation.
  import { onMount } from 'svelte';
  import { PINK, SPRITES, mulberry, sprite, sunCanvas, terrain, meadowDeco } from './pixel.js';

  let sunEl, cloud1, cloud2, cloud3, wlFar, wlMid, wlFront, pollenEl;

  onMount(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    sunEl.appendChild(sunCanvas());
    cloud1.appendChild(sprite(SPRITES.cloudBig.m, SPRITES.cloudBig.p, 9));
    cloud2.appendChild(sprite(SPRITES.cloudSmall.m, SPRITES.cloudSmall.p, 8));
    cloud3.appendChild(sprite(SPRITES.cloudBig.m, SPRITES.cloudBig.p, 6));

    const far = terrain({ px: 24, h: 236, minH: 3, maxH: 8, detail: 0.5, seed: 1013, base: '#a9bda0', edge: '#b8cbae' });
    wlFar.style.backgroundImage = `url(${far.canvas.toDataURL()})`;
    const mid = terrain({ px: 16, h: 172, minH: 3, maxH: 8, detail: 0.55, seed: 2027, base: '#6f9c6b', edge: '#81ad7a' });
    wlMid.style.backgroundImage = `url(${mid.canvas.toDataURL()})`;
    const front = terrain({ px: 14, h: 108, minH: 2, maxH: 6, detail: 0.6, seed: 3061, base: '#7fb069', edge: '#93c47d', deco: meadowDeco });
    wlFront.style.backgroundImage = `url(${front.canvas.toDataURL()})`;

    // Sprites standing on the front crest, repeated once per tile copy.
    const COPIES = 4;
    function plant(x, name, s, grows) {
      const cell = Math.max(0, Math.min(front.heights.length - 1, Math.floor(x / front.px)));
      const b = front.heights[cell] * front.px - 2;
      for (let k = 0; k < COPIES; k++) {
        const wrap = document.createElement('span');
        wrap.className = grows ? 'wspr grow' : 'wspr';
        wrap.style.left = `${x + k * front.w}px`;
        wrap.style.bottom = `${b}px`;
        if (grows) wrap.style.animationDelay = `${-(k * 7.3)}s`;
        const d = SPRITES[name];
        wrap.appendChild(sprite(d.m, d.p, s));
        wlFront.appendChild(wrap);
      }
    }
    plant(260, 'amanita', 4, true); // one mushroom occasionally grows
    plant(690, 'pinkshroom', 3);
    plant(1020, 'daisy', 3);
    plant(1400, 'pinkflower', 3);
    plant(520, 'tuft', 4);
    plant(900, 'tuft', 3);
    plant(1190, 'tuft', 3);

    // Pollen drifting up through the light.
    const R = mulberry(555);
    const COLORS = ['#e2c96f', '#e2c96f', '#e2c96f', '#efe3ba', '#efe3ba', '#cadfb0', PINK];
    for (let i = 0; i < 15; i++) {
      const f = document.createElement('i');
      const s = R() < 0.6 ? 3 : 4;
      f.className = R() < 0.5 ? 'pol-a' : 'pol-b';
      f.style.width = `${s}px`;
      f.style.height = `${s}px`;
      f.style.background = COLORS[Math.floor(R() * COLORS.length)];
      f.style.left = `${Math.floor(R() * 94 + 2)}vw`;
      f.style.bottom = `${Math.floor(R() * 180 + 20)}px`;
      f.style.setProperty('--d', `${9 + Math.floor(R() * 8)}s`);
      f.style.animationDelay = `${-R() * 16}s`;
      pollenEl.appendChild(f);
    }

    // Parallax: scroll offset + slow ambient drift per layer.
    const layers = [
      { el: wlFar, speed: 0.04, drift: 1.6, w: far.w },
      { el: wlMid, speed: 0.11, drift: 3.4, w: mid.w },
      { el: wlFront, speed: 0.26, drift: 7, w: front.w }
    ];
    const setLayers = (sy, t) => {
      for (const L of layers) {
        const x = -Math.round((sy * L.speed + t * L.drift) % L.w);
        L.el.style.transform = `translate3d(${x}px,0,0)`;
      }
    };
    if (reduceMotion) {
      setLayers(0, 0);
      return;
    }
    let raf;
    const t0 = performance.now();
    const loop = (now) => {
      setLayers(window.scrollY || 0, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="sky" aria-hidden="true">
  <span class="sun" bind:this={sunEl}></span>
  <span class="cloud c1" bind:this={cloud1}></span>
  <span class="cloud c2" bind:this={cloud2}></span>
  <span class="cloud c3" bind:this={cloud3}></span>
</div>
<div class="world" aria-hidden="true">
  <div class="wl" bind:this={wlFar}></div>
  <div class="wl" bind:this={wlMid}></div>
  <div class="wl" bind:this={wlFront}></div>
</div>
<div class="pollen" bind:this={pollenEl} aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>

<style>
  .sky {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .sun {
    position: absolute;
    top: 54px;
    right: 6vw;
    opacity: 0.5;
  }
  .sky :global(canvas),
  .world :global(canvas) {
    image-rendering: pixelated;
    display: block;
  }
  .cloud {
    position: absolute;
    left: 0;
    will-change: transform;
    opacity: 0.65;
  }
  .c1 {
    top: 7%;
    animation: clouddrift 170s linear infinite;
    animation-delay: -40s;
  }
  .c2 {
    top: 15%;
    opacity: 0.5;
    animation: clouddrift 240s linear infinite;
    animation-delay: -150s;
  }
  .c3 {
    top: 24%;
    opacity: 0.4;
    animation: clouddrift 300s linear infinite;
    animation-delay: -230s;
  }
  @keyframes clouddrift {
    from {
      transform: translate3d(-320px, 0, 0);
    }
    to {
      transform: translate3d(calc(100vw + 320px), 0, 0);
    }
  }

  .world {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 264px;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .wl {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 100%;
    width: calc(100% + 1536px);
    background-repeat: repeat-x;
    background-position: left bottom;
    will-change: transform;
  }
  .wl :global(.wspr) {
    position: absolute;
    transform-origin: bottom center;
  }
  .wl :global(.wspr.grow) {
    animation: -global-meadow-grow 17s steps(1, end) infinite;
  }
  @keyframes -global-meadow-grow {
    0% {
      transform: scale(0.5);
    }
    24% {
      transform: scale(0.5);
    }
    30% {
      transform: scale(0.75);
    }
    58% {
      transform: scale(0.75);
    }
    64% {
      transform: scale(1);
    }
    96% {
      transform: scale(1);
    }
    100% {
      transform: scale(0.5);
    }
  }

  .pollen {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
  .pollen :global(i) {
    position: absolute;
    display: block;
    opacity: 0;
    will-change: transform, opacity;
  }
  .pollen :global(i.pol-a) {
    animation: -global-meadow-pol-a var(--d, 12s) linear infinite;
  }
  .pollen :global(i.pol-b) {
    animation: -global-meadow-pol-b var(--d, 12s) linear infinite;
  }
  @keyframes -global-meadow-pol-a {
    0% {
      transform: translate3d(0, 0, 0);
      opacity: 0;
    }
    10% {
      opacity: 0.8;
    }
    55% {
      transform: translate3d(22px, -190px, 0);
    }
    88% {
      opacity: 0.25;
    }
    100% {
      transform: translate3d(4px, -360px, 0);
      opacity: 0;
    }
  }
  @keyframes -global-meadow-pol-b {
    0% {
      transform: translate3d(0, 0, 0);
      opacity: 0;
    }
    10% {
      opacity: 0.7;
    }
    55% {
      transform: translate3d(-26px, -170px, 0);
    }
    88% {
      opacity: 0.2;
    }
    100% {
      transform: translate3d(-6px, -330px, 0);
      opacity: 0;
    }
  }

  /* Whisper of grain over the whole page (above content, non-interactive). */
  .grain {
    position: fixed;
    inset: 0;
    z-index: 60;
    pointer-events: none;
    opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect x='0' y='0' width='1' height='1' fill='%231a1714'/%3E%3Crect x='3' y='2' width='1' height='1' fill='%231a1714'/%3E%3Crect x='1' y='4' width='1' height='1' fill='%231a1714'/%3E%3Crect x='5' y='5' width='1' height='1' fill='%231a1714'/%3E%3C/svg%3E");
  }

  @media (prefers-reduced-motion: reduce) {
    .cloud,
    .wl :global(.wspr.grow),
    .pollen :global(i) {
      animation: none !important;
    }
    .pollen :global(i) {
      opacity: 0.5;
    }
  }
</style>
