<script>
  // Footer finale, v7-style: a jagged pixel skyline (soil-colored columns
  // with green grass caps) cuts into the page above a single soil slab with
  // procedural texture — speckles, buried treasures, descending roots.
  // Flora stands on the crest. Static shape; no scroll animation.
  import { onMount } from 'svelte';
  import { CLOUD_MONTHLY_PLAN } from '$lib/pricing.js';
  import { mulberry, sprite, SPRITES } from './pixel.js';

  let { signedIn = false } = $props();

  const RISE_H = 110;

  let riseCanvas, horizonArt, soilEl, soilCanvas;

  onMount(() => {
    function drawRise() {
      const w = Math.max(document.documentElement.clientWidth, 320);
      riseCanvas.width = w;
      riseCanvas.height = RISE_H;
      const g = riseCanvas.getContext('2d');
      const px = 16;
      const cols = Math.ceil(w / px);
      const R = mulberry(909);
      let lvl = 3;
      const heights = [];
      for (let i = 0; i < cols; i++) {
        if (R() < 0.55) lvl += R() < 0.5 ? -1 : 1;
        if (lvl < 1) lvl = 1;
        if (lvl > 6) lvl = 6;
        heights.push(lvl);
        const hh = lvl * px;
        // soil-colored landmass with a sunlit grass cap
        g.fillStyle = '#241a12';
        g.fillRect(i * px, RISE_H - hh, px, hh);
        g.fillStyle = R() < 0.2 ? '#93c47d' : '#7fb069';
        g.fillRect(i * px, RISE_H - hh, px, px);
        g.fillStyle = '#4a7c59';
        g.fillRect(i * px, RISE_H - hh + px, px, px);
      }

      // replant the crest flora
      horizonArt.innerHTML = '';
      const specs = [
        { f: 0.09, n: 'amanita', s: 4 },
        { f: 0.22, n: 'tuft', s: 4 },
        { f: 0.4, n: 'daisy', s: 4 },
        { f: 0.58, n: 'tuft', s: 3 },
        { f: 0.74, n: 'pinkshroom', s: 3 },
        { f: 0.83, n: 'pinkflower', s: 3 },
        { f: 0.92, n: 'lantern', s: 4, dx: 12 } // the one whimsical structure
      ];
      for (const sp of specs) {
        const col = Math.max(0, Math.min(cols - 1, Math.floor(sp.f * cols)));
        const b = heights[col] * px - 2;
        const el = document.createElement('span');
        el.className = 'sprite';
        el.style.left = sp.dx ? `calc(${sp.f * 100}% + ${sp.dx}px)` : `${sp.f * 100}%`;
        el.style.bottom = `${b}px`;
        const d = SPRITES[sp.n];
        el.appendChild(sprite(d.m, d.p, sp.s));
        horizonArt.appendChild(el);
      }
    }

    function drawSoil() {
      const w = soilEl.clientWidth;
      const h = soilEl.clientHeight;
      if (!w || !h) return;
      soilCanvas.width = w;
      soilCanvas.height = h;
      const g = soilCanvas.getContext('2d');
      const R = mulberry(4242);
      const n = Math.floor((w * h) / 2600);
      for (let i = 0; i < n; i++) {
        const x = Math.floor((R() * w) / 4) * 4;
        const y = Math.floor((R() * h) / 4) * 4;
        const r = R();
        g.fillStyle = r < 0.5 ? '#2b2016' : r < 0.8 ? '#1c140d' : '#3a2c1e';
        g.fillRect(x, y, 4, 4);
      }
      // a few buried treasures + descending roots
      for (let j = 0; j < 6; j++) {
        const rx = Math.floor((R() * w) / 4) * 4;
        const ry = Math.floor((R() * h) / 4) * 4;
        g.fillStyle = R() < 0.5 ? 'rgba(250,85,115,.22)' : 'rgba(127,176,105,.18)';
        g.fillRect(rx, ry, 4, 4);
      }
      for (let m = 0; m < 5; m++) {
        let cx = Math.floor((R() * w) / 4) * 4;
        let cy = 0;
        const steps = Math.floor(6 + R() * 10);
        g.fillStyle = '#33261a';
        for (let s = 0; s < steps; s++) {
          g.fillRect(cx, cy, 4, 8);
          cy += 8;
          if (R() < 0.5) cx += R() < 0.5 ? -4 : 4;
          if (cy > h) break;
        }
      }
    }

    drawRise();
    drawSoil();
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        drawRise();
        drawSoil();
      }, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
    };
  });
</script>

<footer>
  <div class="horizon" aria-hidden="true">
    <canvas bind:this={riseCanvas} height={RISE_H}></canvas>
    <div class="horizon-art" bind:this={horizonArt}></div>
  </div>
  <div class="soil" bind:this={soilEl}>
    <canvas class="soiltex" bind:this={soilCanvas} aria-hidden="true"></canvas>
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
    /* avoid a hairline seam against the soil slab */
    margin-bottom: -1px;
  }
  .horizon canvas {
    display: block;
    width: 100%;
    image-rendering: pixelated;
  }
  .horizon-art {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 0;
    pointer-events: none;
  }
  .horizon-art :global(.sprite) {
    position: absolute;
    bottom: 0;
  }
  .horizon-art :global(canvas) {
    display: block;
    image-rendering: pixelated;
  }
  .soil {
    position: relative;
    background: var(--color-soil);
    color: var(--color-soil-ink);
    overflow: hidden;
  }
  .soiltex {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .soil-in {
    position: relative;
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
    position: relative;
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
</style>
