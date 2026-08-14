<script>
  // Footer finale: the meadow rises to a grass crest (with mushrooms, flowers
  // and one lantern post), then the page digs underground — footer content
  // sits in dark soil with pebbles and roots. The crest lifts into place as
  // the footer scrolls into view.
  import { onMount } from 'svelte';
  import { CLOUD_MONTHLY_PLAN } from '$lib/pricing.js';
  import { mulberry, sprite, SPRITES } from './pixel.js';

  let { signedIn = false } = $props();

  const HZH = 224; // canvas height; the .horizon window shows the bottom 190px

  let footerEl, horizonArt, horizonCanvas;
  let sprShroomA, sprShroomB, sprFlowerA, sprFlowerB, sprTuftA, sprLantern;

  onMount(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let heights = [];
    function drawHorizon() {
      const w = Math.max(document.documentElement.clientWidth, 320);
      const px = 12;
      horizonCanvas.width = w;
      horizonCanvas.height = HZH;
      horizonCanvas.style.height = `${HZH}px`;
      const g = horizonCanvas.getContext('2d');
      const R = mulberry(909);
      const cols = Math.ceil(w / px);
      let lvl = 5;
      heights = [];
      for (let i = 0; i < cols; i++) {
        if (R() < 0.5) lvl += R() < 0.5 ? -1 : 1;
        if (lvl < 4) lvl = 4;
        if (lvl > 6) lvl = 6;
        heights.push(lvl);
      }
      for (let i = 0; i < cols; i++) {
        const gh = heights[i] * px;
        const top = HZH - 62 - gh;
        g.fillStyle = '#7fb069';
        g.fillRect(i * px, top, px, gh - 24);
        g.fillStyle = '#93c47d';
        g.fillRect(i * px, top, px, px);
        g.fillStyle = '#3d2b1a';
        g.fillRect(i * px, top + gh - 24, px, 24);
        g.fillStyle = '#241a12';
        g.fillRect(i * px, top + gh, px, HZH - (top + gh));
        const r = R();
        if (r < 0.14) {
          g.fillStyle = '#93c47d';
          g.fillRect(i * px + 4, top - 4, 4, 4);
        } else if (r < 0.18) {
          g.fillStyle = '#4a7c59';
          g.fillRect(i * px + 5, top - 4, 3, 4);
          g.fillStyle = '#fffdf4';
          g.fillRect(i * px + 2, top - 10, 9, 6);
          g.fillStyle = '#eec94f';
          g.fillRect(i * px + 5, top - 8, 3, 3);
        }
        if (R() < 0.2) {
          g.fillStyle = '#453521';
          g.fillRect(i * px + Math.floor(R() * 8), top + gh + 6 + Math.floor(R() * 40), 4, 4);
        }
        if (R() < 0.08) {
          g.fillStyle = '#33261a';
          g.fillRect(i * px + 4, top + gh - 10, 2, 26);
        }
        if (R() < 0.02) {
          g.fillStyle = 'rgba(250,85,115,.55)';
          g.fillRect(i * px + 6, top + gh + 30 + Math.floor(R() * 30), 3, 3);
        } else if (R() < 0.02) {
          g.fillStyle = 'rgba(127,176,105,.5)';
          g.fillRect(i * px + 6, top + gh + 30 + Math.floor(R() * 30), 3, 3);
        }
      }
    }

    // Sprites standing on the crest, at fixed fractions of the width.
    const crest = [
      { get el() { return sprShroomA; }, n: 'amanita', s: 5, x: 0.16 },
      { get el() { return sprShroomB; }, n: 'pinkshroom', s: 4, x: 0.74 },
      { get el() { return sprFlowerA; }, n: 'daisy', s: 3, x: 0.3 },
      { get el() { return sprFlowerB; }, n: 'pinkflower', s: 3, x: 0.62 },
      { get el() { return sprTuftA; }, n: 'tuft', s: 4, x: 0.44 },
      { get el() { return sprLantern; }, n: 'lantern', s: 4, x: 0.88 } // the one whimsical structure
    ];
    function placeSprites() {
      const w = Math.max(document.documentElement.clientWidth, 320);
      const px = 12;
      for (const m of crest) {
        const d = SPRITES[m.n];
        m.el.innerHTML = '';
        m.el.appendChild(sprite(d.m, d.p, m.s));
        const x = Math.floor(w * m.x);
        const cell = Math.max(0, Math.min(heights.length - 1, Math.floor(x / px)));
        const gh = heights[cell] * px;
        const top = HZH - 62 - gh;
        m.el.style.left = `${x}px`;
        m.el.style.bottom = `${HZH - top}px`;
      }
    }

    // Soil texture tile.
    function soilTile() {
      const c = document.createElement('canvas');
      c.width = 384;
      c.height = 384;
      const g = c.getContext('2d');
      const R = mulberry(4242);
      g.fillStyle = '#241a12';
      g.fillRect(0, 0, 384, 384);
      for (let i = 0; i < 150; i++) {
        const x = Math.floor(R() * 95) * 4;
        const y = Math.floor(R() * 95) * 4;
        const r = R();
        if (r < 0.5) {
          g.fillStyle = '#2b2016';
          g.fillRect(x, y, 4, 4);
        } else if (r < 0.8) {
          g.fillStyle = '#1c140d';
          g.fillRect(x, y, 4, 4);
        } else if (r < 0.94) {
          g.fillStyle = '#3a2c1e';
          g.fillRect(x, y, 4, 4);
        } else if (r < 0.985) {
          g.fillStyle = '#453521';
          g.fillRect(x, y, 8, 4);
        } else if (r < 0.993) {
          g.fillStyle = 'rgba(250,85,115,.4)';
          g.fillRect(x, y, 3, 3);
        } else {
          g.fillStyle = 'rgba(127,176,105,.35)';
          g.fillRect(x, y, 3, 3);
        }
      }
      for (let rt = 0; rt < 5; rt++) {
        let rx = Math.floor(R() * 90) * 4;
        let ry = 0;
        g.fillStyle = '#33261a';
        while (ry < 384) {
          g.fillRect(rx, ry, 3, 10);
          ry += 10;
          rx += R() < 0.5 ? -4 : 4;
          if (rx < 0) rx = 0;
          if (rx > 380) rx = 380;
          if (R() < 0.18) break;
        }
      }
      return c.toDataURL();
    }

    drawHorizon();
    placeSprites();
    footerEl.querySelector('.soil').style.backgroundImage = `url(${soilTile()})`;

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        drawHorizon();
        placeSprites();
      }, 160);
    };
    window.addEventListener('resize', onResize);

    // Crest rise as the footer enters the viewport.
    let raf;
    const setHorizon = () => {
      const r = footerEl.getBoundingClientRect();
      const vh = window.innerHeight;
      let p = (vh - r.top + 40) / 220;
      p = Math.max(0, Math.min(1, p));
      horizonArt.style.transform = `translate3d(0,${Math.round((1 - p) * 34)}px,0)`;
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(setHorizon);
    };
    if (reduceMotion) {
      horizonArt.style.transform = 'none';
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
      setHorizon();
    }
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
    };
  });
</script>

<footer bind:this={footerEl}>
  <div class="horizon" aria-hidden="true">
    <div class="horizon-art" bind:this={horizonArt}>
      <canvas bind:this={horizonCanvas} height={HZH}></canvas>
      <span class="hspr" bind:this={sprShroomA}></span>
      <span class="hspr" bind:this={sprShroomB}></span>
      <span class="hspr" bind:this={sprFlowerA}></span>
      <span class="hspr" bind:this={sprFlowerB}></span>
      <span class="hspr" bind:this={sprTuftA}></span>
      <span class="hspr" bind:this={sprLantern}></span>
    </div>
  </div>
  <div class="soil">
    <div class="soil-in">
      <div class="soil-brand">
        <div class="brandrow">
          <img src="/mascot.png" alt="" width="30" height="30" />
          <b>SUPA<span>CLANK</span></b>
        </div>
        <small>Build mobile apps entirely from your phone. Open-source, self-hostable, free.</small>
      </div>
      <div class="soil-col">
        <h4>Product</h4>
        <ul>
          <li><a href="https://play.google.com/store/apps/details?id=com.supaclank.clank" rel="noreferrer">Get the app</a></li>
          <li><a href="/demo">Web demo</a></li>
          <li><a href="/pricing">Pricing · {CLOUD_MONTHLY_PLAN.price}/mo</a></li>
          {#if signedIn}
            <li><a href="/welcome">Account</a></li>
          {:else}
            <li><a href="/signup">Sign in</a></li>
          {/if}
        </ul>
      </div>
      <div class="soil-col">
        <h4>Source</h4>
        <ul>
          <li><a href="https://github.com/Acksell/clank" rel="noreferrer">github.com/Acksell/clank</a></li>
          <li><a href="https://github.com/Acksell/clank#self-hosting" rel="noreferrer">Self-hosting</a></li>
          <li><a href="/terms">Terms</a></li>
          <li><a href="/privacy">Privacy</a></li>
        </ul>
      </div>
    </div>
    <div class="soil-note">
      <span>© {new Date().getFullYear()} Supaclank · MIT</span>
      <span class="rootline"></span>
      <span>open-source · self-hostable · free</span>
    </div>
  </div>
</footer>

<style>
  footer {
    position: relative;
    z-index: 1;
    margin-top: 40px;
  }
  .horizon {
    position: relative;
    height: 190px;
    overflow: hidden;
  }
  .horizon-art {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    will-change: transform;
    transform: translate3d(0, 34px, 0);
  }
  .horizon-art canvas {
    width: 100%;
    image-rendering: pixelated;
    display: block;
  }
  .hspr {
    position: absolute;
    transform-origin: bottom center;
  }
  .hspr :global(canvas) {
    image-rendering: pixelated;
    display: block;
  }
  .soil {
    background: var(--color-soil);
    color: var(--color-soil-ink);
    position: relative;
  }
  .soil-in {
    max-width: 1180px;
    margin: 0 auto;
    padding: 46px 32px 40px;
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: 40px;
  }
  .soil-brand {
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
  }
  .brandrow {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .soil-brand img {
    width: 30px;
    height: 30px;
    border-radius: 4px;
  }
  .soil-brand b {
    font-family: var(--font-pixel);
    font-size: 12px;
    letter-spacing: 0.05em;
    color: var(--color-soil-paper);
  }
  .soil-brand b span {
    color: var(--color-brand);
  }
  .soil-brand small {
    font: 400 12px/1.6 var(--font-sans);
    color: rgba(216, 207, 192, 0.75);
    max-width: 34ch;
  }
  .soil h4 {
    font: 700 10px var(--font-mono);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(216, 207, 192, 0.6);
    margin-bottom: 14px;
  }
  .soil-col ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
  }
  .soil-col a {
    font: 500 13px var(--font-sans);
    color: var(--color-soil-paper);
    text-decoration: none;
    border-bottom: 1px solid rgba(240, 233, 220, 0.18);
    padding-bottom: 1px;
  }
  .soil-col a:hover {
    color: #ff8ba0;
    border-bottom-color: #ff8ba0;
  }
  .soil-note {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 32px 34px;
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
    align-items: center;
    font: 400 11.5px var(--font-mono);
    color: rgba(216, 207, 192, 0.55);
  }
  .rootline {
    flex: 1;
    height: 1px;
    background: rgba(216, 207, 192, 0.14);
    min-width: 60px;
  }
  @media (max-width: 1020px) {
    .soil-in {
      grid-template-columns: 1fr 1fr;
    }
    .soil-brand {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 620px) {
    .soil-in {
      padding: 38px 18px 32px;
      gap: 28px;
    }
    .soil-note {
      padding: 0 18px 30px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .horizon-art {
      transform: none;
    }
  }
</style>
