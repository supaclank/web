<script>
  import { Tween, prefersReducedMotion } from 'svelte/motion';
  let { added, removed } = $props();
  const counts = new Tween({ added: 0, removed: 0 }, { duration: 320 });
  $effect(() => { void counts.set({ added, removed }, { duration: prefersReducedMotion.current ? 0 : 320 }); });
</script>
<span class="demo-diff-stat" aria-label={`${added} additions, ${removed} deletions`}><span class="diff-added">+{Math.round(counts.current.added)}</span><span class="diff-removed">−{Math.round(counts.current.removed)}</span></span>
