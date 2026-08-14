<script>
  // Renders a named pixel sprite (from the Meadow toolkit) as a crisp canvas.
  import { onMount } from 'svelte';
  import { sprite, SPRITES } from './pixel.js';

  let { name, scale = 3 } = $props();
  let host;

  onMount(() => {
    const d = SPRITES[name];
    if (d) host.appendChild(sprite(d.m, d.p, scale));
  });
</script>

<span bind:this={host} class="spr" aria-hidden="true"></span>

<style>
  .spr {
    display: inline-block;
    line-height: 0;
  }
  .spr :global(canvas) {
    display: block;
    image-rendering: pixelated;
  }
</style>
