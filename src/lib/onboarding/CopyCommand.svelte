<script>
  let { command } = $props();
  let isCopied = $state(false);
  let error = $state('');

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      isCopied = true;
      error = '';
    } catch {
      isCopied = false;
      error = 'Couldn’t copy. Select the command and copy it manually.';
    }
  }
</script>

<div class="mt-3 flex items-center gap-3 rounded-xl bg-ink p-3 pl-4 text-paper">
  <code class="min-w-0 flex-1 overflow-x-auto py-1 font-mono text-xs whitespace-nowrap sm:text-sm">{command}</code>
  <button onclick={copy} aria-label={`Copy ${command}`} class="min-h-10 shrink-0 rounded-lg border border-white/15 px-3 text-xs hover:bg-white/10">{isCopied ? 'Copied' : 'Copy'}</button>
</div>
<span class="sr-only" role="status">{isCopied ? 'Command copied' : ''}</span>
{#if error}<p role="alert" class="mt-2 text-xs text-danger">{error}</p>{/if}
