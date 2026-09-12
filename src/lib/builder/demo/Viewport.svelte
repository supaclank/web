<script>
  import { useSvelteFlow } from '@xyflow/svelte';
  const { setViewport } = useSvelteFlow();
  export function focus(viewport) {
    return setViewport(viewport);
  }
</script>
