<script>
  let { title, detail, children } = $props();
</script>

<div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm sm:p-8">
  <div class="flex items-start gap-4">
    <span class="mt-1 inline-block h-3 w-3 shrink-0 animate-pulse rounded-full bg-brand"></span>
    <div class="min-w-0 flex-1">
      <h1 class="text-xl font-semibold">{title}</h1>
      <p class="mt-1 text-sm text-muted">{detail}</p>
      {#if children}{@render children()}{/if}
    </div>
  </div>
</div>
