<script>
  let { children, width = 'narrow' } = $props();

  // A shared projected mesh keeps every surface connected at the room's
  // corners and back-wall seams.
  const COLUMNS = Array.from({ length: 23 }, (_, index) => (index + 1) / 24);
  const ROWS = Array.from({ length: 20 }, (_, index) => (index + 1) / 21);
  const DEPTHS = [0.217, 0.385, 0.517, 0.625, 0.714, 0.79, 0.853, 0.908, 0.957];
</script>

<div class:wide-room={width === 'wide'} class="corridor-page">
  <div class="corridor" aria-hidden="true">
    <svg class="corridor-art" viewBox="0 0 1000 1000" preserveAspectRatio="none" focusable="false">
      <defs>
        <radialGradient id="corridor-wall-light" cx="50%" cy="50%" r="62%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="0.65" stop-color="#ffffff" stop-opacity="0.34" />
          <stop offset="1" stop-color="#fa5573" stop-opacity="0.035" />
        </radialGradient>
        <radialGradient id="corridor-room-light" cx="50%" cy="50%" r="66%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="0.62" stop-color="#faf8f4" stop-opacity="0.08" />
          <stop offset="1" stop-color="#dfd9d0" stop-opacity="0.5" />
        </radialGradient>
      </defs>

      <rect width="1000" height="1000" class="room-base" />
      <polygon class="room-surface" points="0,0 1000,0 700,165 300,165" />
      <polygon class="room-surface floor-surface" points="0,1000 300,835 700,835 1000,1000" />
      <polygon class="room-surface" points="0,0 300,165 300,835 0,1000" />
      <polygon class="room-surface" points="1000,0 700,165 700,835 1000,1000" />
      <rect x="300" y="165" width="400" height="670" class="back-wall" />

      <g class="room-grid">
        {#each COLUMNS as position}
          <line x1={position * 1000} y1="0" x2={300 + position * 400} y2="165" />
          <line x1={position * 1000} y1="1000" x2={300 + position * 400} y2="835" />
          <line x1={300 + position * 400} y1="165" x2={300 + position * 400} y2="835" />
        {/each}

        {#each ROWS as position}
          <line x1="0" y1={position * 1000} x2="300" y2={165 + position * 670} />
          <line x1="1000" y1={position * 1000} x2="700" y2={165 + position * 670} />
          <line x1="300" y1={165 + position * 670} x2="700" y2={165 + position * 670} />
        {/each}

        {#each DEPTHS as depth}
          <line x1={depth * 300} y1={depth * 165} x2={1000 - depth * 300} y2={depth * 165} />
          <line x1={depth * 300} y1={1000 - depth * 165} x2={1000 - depth * 300} y2={1000 - depth * 165} />
          <line x1={depth * 300} y1={depth * 165} x2={depth * 300} y2={1000 - depth * 165} />
          <line x1={1000 - depth * 300} y1={depth * 165} x2={1000 - depth * 300} y2={1000 - depth * 165} />
        {/each}
      </g>

      <rect width="1000" height="1000" fill="url(#corridor-room-light)" />
      <path class="room-seams" d="M0 0 300 165H700L1000 0M0 1000 300 835H700L1000 1000M300 165V835M700 165V835" />
    </svg>
  </div>

  <main class:wide={width === 'wide'} class="corridor-content">
    <a href="/" class="brand">
      <img src="/mascot.png" alt="" width="40" height="40" />
      <span>supaclank</span>
    </a>
    {@render children()}
  </main>
</div>

<style>
  .corridor-page {
    position: relative;
    isolation: isolate;
    display: grid;
    min-height: 100svh;
    place-items: center;
    overflow: hidden;
    padding: 3rem 1.25rem;
    background: var(--color-paper);
  }

  .corridor {
    position: absolute;
    z-index: -1;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .corridor-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .room-base {
    fill: var(--color-paper);
  }

  .room-surface {
    fill: #f7f4ef;
  }

  .floor-surface {
    fill: #f1eee8;
  }

  .room-grid line {
    stroke: rgba(26, 23, 20, 0.09);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .back-wall {
    fill: url(#corridor-wall-light);
  }

  .room-seams {
    fill: none;
    stroke: rgba(250, 85, 115, 0.24);
    stroke-width: 1.25;
    vector-effect: non-scaling-stroke;
  }

  .corridor-content {
    position: relative;
    width: 100%;
    max-width: 24rem;
  }

  .corridor-content.wide {
    max-width: 42rem;
  }

  .brand {
    display: flex;
    width: fit-content;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    margin: 0 auto 2rem;
    border-radius: 0.875rem;
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .brand img {
    border-radius: 0.75rem;
  }

  @media (max-width: 640px) {
    .corridor-page {
      overflow-y: auto;
      padding-top: 2rem;
      padding-bottom: 2rem;
    }

    .corridor-art {
      left: -65%;
      width: 230%;
    }

    .room-grid line {
      stroke-opacity: 0.78;
    }

    .brand {
      margin-bottom: 1.5rem;
    }
  }

  @media (min-width: 641px) and (max-width: 1100px) {
    .corridor-page.wide-room .corridor-art {
      left: -45%;
      width: 190%;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .corridor-content {
      animation: settle-on-wall 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
  }

  @keyframes settle-on-wall {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
