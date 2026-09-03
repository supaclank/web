<script>
  import { onMount } from 'svelte';

  let { children, width = 'narrow', parallax = true } = $props();

  // A shared projected mesh keeps every surface connected at the room's
  // corners and back-wall seams.
  const COLUMNS = Array.from({ length: 23 }, (_, index) => (index + 1) / 24);
  const ROWS = Array.from({ length: 20 }, (_, index) => (index + 1) / 21);
  const DEPTHS = [0.217, 0.385, 0.517, 0.625, 0.714, 0.79, 0.853, 0.908, 0.957];
  const NEAR_VERTICAL_OVERSCAN = 340;
  const MAX_NEAR_SHIFT_Y = -320;
  const MAX_BACK_SHIFT_Y = -70;

  let pageElement;
  let scrollOffset = $state(0);
  let maxScroll = $state(1);
  let prefersReducedMotion = $state(false);
  let projection = $derived.by(() => {
    const progress = prefersReducedMotion || !parallax
      ? 0
      : Math.min(Math.max(scrollOffset, 0) / maxScroll, 1);
    const nearShiftY = progress * MAX_NEAR_SHIFT_Y;
    const backShiftY = progress * MAX_BACK_SHIFT_Y;

    return {
      left: 300,
      right: 700,
      top: 165 + backShiftY,
      bottom: 835 + backShiftY,
      width: 400,
      height: 670,
      nearLeft: 0,
      nearRight: 1000,
      nearTop: -NEAR_VERTICAL_OVERSCAN + nearShiftY,
      nearBottom: 1000 + NEAR_VERTICAL_OVERSCAN + nearShiftY,
      nearWidth: 1000,
      nearHeight: 1000 + NEAR_VERTICAL_OVERSCAN * 2
    };
  });

  onMount(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;
    let layoutFrame = 0;

    function readScroll() {
      animationFrame = 0;
      scrollOffset = window.scrollY;
    }

    function scheduleRead() {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(readScroll);
    }

    function readLayout() {
      layoutFrame = 0;
      maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollOffset = window.scrollY;
    }

    function scheduleLayoutRead() {
      if (!layoutFrame) layoutFrame = window.requestAnimationFrame(readLayout);
    }

    function readMotionPreference() {
      prefersReducedMotion = motionPreference.matches;
      scheduleRead();
    }

    readMotionPreference();
    readLayout();
    window.addEventListener('scroll', scheduleRead, { passive: true });
    window.addEventListener('resize', scheduleLayoutRead, { passive: true });
    motionPreference.addEventListener('change', readMotionPreference);
    const resizeObserver = new ResizeObserver(scheduleLayoutRead);
    resizeObserver.observe(pageElement);

    return () => {
      window.removeEventListener('scroll', scheduleRead);
      window.removeEventListener('resize', scheduleLayoutRead);
      motionPreference.removeEventListener('change', readMotionPreference);
      resizeObserver.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (layoutFrame) window.cancelAnimationFrame(layoutFrame);
    };
  });
</script>

<div bind:this={pageElement} class:wide-room={width === 'wide'} class="corridor-page">
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
      <polygon class="room-surface" points={`${projection.nearLeft},${projection.nearTop} ${projection.nearRight},${projection.nearTop} ${projection.right},${projection.top} ${projection.left},${projection.top}`} />
      <polygon class="room-surface floor-surface" points={`${projection.nearLeft},${projection.nearBottom} ${projection.left},${projection.bottom} ${projection.right},${projection.bottom} ${projection.nearRight},${projection.nearBottom}`} />
      <polygon class="room-surface" points={`${projection.nearLeft},${projection.nearTop} ${projection.left},${projection.top} ${projection.left},${projection.bottom} ${projection.nearLeft},${projection.nearBottom}`} />
      <polygon class="room-surface" points={`${projection.nearRight},${projection.nearTop} ${projection.right},${projection.top} ${projection.right},${projection.bottom} ${projection.nearRight},${projection.nearBottom}`} />
      <rect x={projection.left} y={projection.top} width={projection.width} height={projection.height} class="back-wall" />

      <g class="room-grid">
        {#each COLUMNS as position}
          <line x1={projection.nearLeft + position * projection.nearWidth} y1={projection.nearTop} x2={projection.left + position * projection.width} y2={projection.top} />
          <line x1={projection.nearLeft + position * projection.nearWidth} y1={projection.nearBottom} x2={projection.left + position * projection.width} y2={projection.bottom} />
          <line x1={projection.left + position * projection.width} y1={projection.top} x2={projection.left + position * projection.width} y2={projection.bottom} />
        {/each}

        {#each ROWS as position}
          <line x1={projection.nearLeft} y1={projection.nearTop + position * projection.nearHeight} x2={projection.left} y2={projection.top + position * projection.height} />
          <line x1={projection.nearRight} y1={projection.nearTop + position * projection.nearHeight} x2={projection.right} y2={projection.top + position * projection.height} />
          <line x1={projection.left} y1={projection.top + position * projection.height} x2={projection.right} y2={projection.top + position * projection.height} />
        {/each}

        {#each DEPTHS as depth}
          <line x1={projection.nearLeft + depth * (projection.left - projection.nearLeft)} y1={projection.nearTop + depth * (projection.top - projection.nearTop)} x2={projection.nearRight + depth * (projection.right - projection.nearRight)} y2={projection.nearTop + depth * (projection.top - projection.nearTop)} />
          <line x1={projection.nearLeft + depth * (projection.left - projection.nearLeft)} y1={projection.nearBottom + depth * (projection.bottom - projection.nearBottom)} x2={projection.nearRight + depth * (projection.right - projection.nearRight)} y2={projection.nearBottom + depth * (projection.bottom - projection.nearBottom)} />
          <line x1={projection.nearLeft + depth * (projection.left - projection.nearLeft)} y1={projection.nearTop + depth * (projection.top - projection.nearTop)} x2={projection.nearLeft + depth * (projection.left - projection.nearLeft)} y2={projection.nearBottom + depth * (projection.bottom - projection.nearBottom)} />
          <line x1={projection.nearRight + depth * (projection.right - projection.nearRight)} y1={projection.nearTop + depth * (projection.top - projection.nearTop)} x2={projection.nearRight + depth * (projection.right - projection.nearRight)} y2={projection.nearBottom + depth * (projection.bottom - projection.nearBottom)} />
        {/each}
      </g>

      <rect width="1000" height="1000" fill="url(#corridor-room-light)" />
      <path
        class="room-seams"
        d={`M${projection.nearLeft} ${projection.nearTop} ${projection.left} ${projection.top}H${projection.right}L${projection.nearRight} ${projection.nearTop}M${projection.nearLeft} ${projection.nearBottom} ${projection.left} ${projection.bottom}H${projection.right}L${projection.nearRight} ${projection.nearBottom}M${projection.left} ${projection.top}V${projection.bottom}M${projection.right} ${projection.top}V${projection.bottom}`}
      />
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
    position: fixed;
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
