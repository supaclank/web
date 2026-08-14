<script>
  // Conveyor belt of framework plates riding inside the pink frontend band.
  // The strip holds two copies of the run and translates -50% for a seamless
  // loop; hover pauses it. Logos are simplified square-cap glyphs.
  const logos = [
    { n: 'expo', d: 'M12 4 3.5 19.5h5L12 13l3.5 6.5h5z' },
    { n: 'react', react: true },
    { n: 'svelte', d: null, svelte: true },
    { n: 'vue', vue: true },
    { n: 'next.js', next: true },
    { n: 'vite', vite: true },
    { n: 'preact', preact: true }
  ];
</script>

<div class="belt" aria-label="Works with Expo, React, Svelte, Vue, Next.js, Vite and Preact">
  <div class="belt-strip">
    {#each [0, 1] as copy (copy)}
      <div class="belt-run" aria-hidden={copy === 1}>
        {#each logos as l (copy + l.n)}
          <span class="cell">
            <span class="plate">
              {#if l.react}
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" /></svg>
              {:else if l.svelte}
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M16.5 3.5c-2.4-1.6-5.6-.9-7.4 1.2L5.6 9c-1.6 2-1.2 4.9.8 6.4" /><path d="M7.5 20.5c2.4 1.6 5.6.9 7.4-1.2l3.5-4.3c1.6-2 1.2-4.9-.8-6.4" /></svg>
              {:else if l.vue}
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M2.5 4.5 12 20.5 21.5 4.5" /><path d="M7.5 4.5 12 12l4.5-7.5" /></svg>
              {:else if l.next}
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><circle cx="12" cy="12" r="9.5" /><path d="M9 16V8.5L15.5 17" /></svg>
              {:else if l.vite}
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M2.5 4.5 12 20.5 21.5 4.5" /><path d="M13.5 3.5 12 10h3l-4 8 1-6h-3z" fill="currentColor" stroke="none" /></svg>
              {:else if l.preact}
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(45 12 12)" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(135 12 12)" /></svg>
              {:else}
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d={l.d} /></svg>
              {/if}
              <b>{l.n}</b>
            </span>
          </span>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .belt {
    border-top: 2px solid rgba(26, 23, 20, 0.35);
    border-bottom: 2px solid rgba(26, 23, 20, 0.35);
    background: rgba(0, 0, 0, 0.14);
    overflow: hidden;
  }
  .belt-strip {
    display: flex;
    width: max-content;
    will-change: transform;
    animation: beltmove 44s linear infinite;
  }
  .belt:hover .belt-strip {
    animation-play-state: paused;
  }
  @keyframes beltmove {
    from {
      transform: translate3d(0, 0, 0);
    }
    to {
      transform: translate3d(-50%, 0, 0);
    }
  }
  .belt-run {
    display: flex;
    background: repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.16) 0 4px, transparent 4px 33px);
    padding: 20px 0 14px;
  }
  .cell {
    width: 132px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: none;
  }
  .plate {
    width: 88px;
    height: 88px;
    background: #fff;
    border: 1.5px solid rgba(26, 23, 20, 0.4);
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 3px 3px 0 0 rgba(26, 23, 20, 0.3);
    color: var(--color-ink);
  }
  .plate svg {
    display: block;
  }
  .plate b {
    font: 500 9.5px var(--font-mono);
    letter-spacing: 0.06em;
    color: var(--color-muted);
  }
  @media (prefers-reduced-motion: reduce) {
    .belt-strip {
      animation: none;
    }
  }
</style>
