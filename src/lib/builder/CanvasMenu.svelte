<script>
  import { tick } from 'svelte';
  import { useSvelteFlow } from '@xyflow/svelte';
  import Icon from './Icon.svelte';
  import { contextMenuPosition } from './context-menu.js';
  let { oncreate, canvas } = $props();
  const { screenToFlowPosition } = useSvelteFlow();
  let context = $state(null);
  let menu = $state(null);
  let item = $state(null);

  export async function open({ event }) {
    event.preventDefault();
    await openAt({ x: event.clientX, y: event.clientY });
  }
  async function openAt(point) {
    context = { screen: point, position: screenToFlowPosition(point, { snapToGrid: false }) };
    await tick();
    if (!context) return;
    context.screen = contextMenuPosition(point, menu.getBoundingClientRect(), { width: innerWidth, height: innerHeight });
    item.focus({ preventScroll: true });
  }
  export function keyboard(event) {
    if (event.target !== event.currentTarget || !(event.key === 'ContextMenu' || event.key === 'F10' && event.shiftKey)) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    void openAt({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }
  export function focusCanvas() { canvas.querySelector('.svelte-flow').focus({ preventScroll: true }); }
  export function close() { context = null; }
  function dismiss(event) { if (context && !menu.contains(event.target)) close(); }
  function keydown(event) {
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); }
      close(); focusCanvas();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); item.focus();
    }
  }
  function create() {
    const position = context.position;
    close();
    oncreate(position);
  }
</script>
<svelte:window onpointerdown={dismiss} onresize={close} onblur={close} onwheel={close} onscroll={close} />
{#if context}
  <div class="canvas-menu nodrag nopan nowheel" role="menu" tabindex="-1" aria-label="Canvas actions" style:left={`${context.screen.x}px`} style:top={`${context.screen.y}px`} bind:this={menu} onkeydown={keydown}>
    <button type="button" role="menuitem" onclick={create} bind:this={item}><Icon name="plus" size={16} />New session</button>
  </div>
{/if}
<style>
  .canvas-menu { position: fixed; z-index: 100; width: 184px; max-width: calc(100vw - 16px); padding: 4px; border: 1px solid var(--builder-line); border-radius: 8px; background: var(--builder-panel); color: var(--builder-text); }
  .canvas-menu button { display: flex; align-items: center; gap: 9px; width: 100%; min-height: 36px; padding: 6px 9px; border: 0; border-radius: 4px; background: transparent; color: inherit; font-size: 13px; line-height: 20px; text-align: left; cursor: pointer; }
  .canvas-menu button:hover, .canvas-menu button:focus-visible { background: var(--builder-raised); }
  .canvas-menu button:focus-visible { outline: 1px solid var(--builder-accent); outline-offset: -1px; }
</style>
