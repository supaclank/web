<script>
  import { tick } from 'svelte';
  import { CURSOR_TARGET } from './playback.js';
  import { DEMO_NODE } from './model.js';
  let { root, frame, viewport, nodes, isWorking, isScripted, onopen, onposition } = $props();
  let point = $state(null);
  let lastWorldPoint = null;
  let geometry = $derived({ frame, viewport, nodes });
  $effect(() => {
    const current = geometry;
    let isCancelled = false;
    void tick().then(() => { if (!isCancelled) measure(current); });
    return () => { isCancelled = true; };
  });
  function measure(current) {
    const frame = current.frame;
    const bounds = root.getBoundingClientRect();
    function anchor(target) {
      const nodeId = target === CURSOR_TARGET.preview ? DEMO_NODE.preview : DEMO_NODE.agent;
      const control = target === CURSOR_TARGET.entry ? CURSOR_TARGET.prompt : target;
      const element = root.querySelector(`[data-id="${nodeId}"] [data-demo-target="${control}"]`);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left - bounds.left + (control === CURSOR_TARGET.prompt ? 35 : rect.width / 2) + (target === CURSOR_TARGET.entry ? 90 : 0), y: rect.top - bounds.top + (control === CURSOR_TARGET.prompt ? 22 : rect.height / 2) + (target === CURSOR_TARGET.entry ? 55 : 0) };
    }
    const from = anchor(frame.from), to = anchor(frame.to);
    if (!from || !to) {
      if (lastWorldPoint) point = { x: lastWorldPoint.x * current.viewport.zoom + current.viewport.x, y: lastWorldPoint.y * current.viewport.zoom + current.viewport.y };
      return;
    }
    const progress = 1 - Math.pow(1 - frame.progress, 3);
    point = { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
    lastWorldPoint = { x: (point.x - current.viewport.x) / current.viewport.zoom, y: (point.y - current.viewport.y) / current.viewport.zoom };
    onposition(lastWorldPoint);
  }
</script>
{#if point}<div class="demo-cursor" class:is-clicking={isScripted && frame.isClicking} style:transform={`translate(${point.x}px, ${point.y}px)`}><i aria-hidden="true"></i><svg aria-hidden="true" width="25" height="25" viewBox="0 0 25 25"><path d="M2.5 2.5 9 22l4.5-8.5L22 9Z" stroke-width="1.5" stroke-linejoin="round" /></svg><button type="button" class="demo-cursor-tag" onclick={onopen} aria-label={`Chat with Clank · ${isWorking ? 'Working' : 'Idle'}`}><span class="cursor-status" class:is-working={isWorking} aria-hidden="true"></span>Clank</button></div>{/if}
<style>
  .demo-cursor { --cursor-color: #8aa4ff; --cursor-ink: #111b3c; position: absolute; z-index: 10; top: 0; left: 0; pointer-events: none; will-change: transform; }
  .demo-cursor svg { position: absolute; left: -2.5px; top: -2.5px; fill: var(--cursor-color); stroke: #dce4ff; filter: drop-shadow(0 2px 3px #0006); }
  :global(.clank-builder .demo-browser) .demo-cursor-tag { position: absolute; top: 21px; left: 18px; min-height: 24px; padding: 3px 7px; gap: 5px; border-radius: 4px; background: var(--cursor-color); color: var(--cursor-ink); font-size: 11px; font-weight: 600; line-height: 16px; pointer-events: auto; }
  :global(.clank-builder .demo-browser) .demo-cursor-tag:hover { background: #a5b9ff; color: var(--cursor-ink); }
  .cursor-status { width: 5px; height: 5px; border: 1px solid currentColor; border-radius: 50%; }
  .cursor-status.is-working { background: currentColor; }
  .demo-cursor i { position: absolute; width: 26px; height: 26px; top: -13px; left: -13px; border: 1px solid var(--cursor-color); border-radius: 50%; background: #8aa4ff24; opacity: 0; }
  .demo-cursor.is-clicking i { opacity: 1; }
  .demo-cursor.is-clicking svg { transform: scale(.86); transform-origin: 2.5px 2.5px; }
</style>
