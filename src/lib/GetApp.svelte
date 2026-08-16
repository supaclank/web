<script>
  // Primary funnel: the Play Store badge. On desktop a scan-to-install QR
  // appears as a popover when the badge is hovered/focused, so it stays out
  // of the layout until wanted. The app isn't live yet, but the link is
  // wired for launch.
  import PlayBadge from '$lib/PlayBadge.svelte';
  import QrPlay from '$lib/QrPlay.svelte';

  let { qr = false, variant = 'onlight' } = $props();
</script>

<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
  {#if qr}
    <!-- Badge + scan-to-install popover. The QR is only useful on a larger
         screen, so the popover is hover/focus-driven and hidden on phones. -->
    <div class="group relative">
      <PlayBadge {variant} />

      <div
        class="pointer-events-none absolute top-full left-1/2 z-20 mt-3 hidden -translate-x-1/2 -translate-y-1 opacity-0 transition duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 lg:block"
        role="tooltip"
        aria-hidden="true"
      >
        <!-- little pointer up toward the badge -->
        <div
          class="absolute bottom-full left-1/2 -mb-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-t border-l border-line bg-paper"
        ></div>
        <div
          class="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-paper p-2.5 shadow-lg"
        >
          <div class="h-28 w-28 overflow-hidden rounded-md ring-1 ring-line">
            <QrPlay />
          </div>
          <span class="text-[11px] leading-tight text-dim">Scan to install</span>
        </div>
      </div>
    </div>
  {:else}
    <PlayBadge {variant} />
  {/if}
</div>
