<script>
  let { onselect } = $props();
  const interactive = 'input, textarea, select, button, a, [contenteditable="true"], [role="textbox"]';
  export function select({ node, event }) {
    if (event.target.closest(interactive)) return;
    onselect(node.id);
    event.currentTarget.focus({ preventScroll: true });
  }
</script>
