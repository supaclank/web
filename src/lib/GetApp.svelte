<script>
  // Primary funnel: the Play Store badge plus a scan-to-install QR (desktop
  // only). The app isn't live yet, but the link is wired for launch.
  import PlayBadge from '$lib/PlayBadge.svelte';
  import QrPlay from '$lib/QrPlay.svelte';

  let { qr = false, variant = 'onlight' } = $props();
  let dark = $derived(variant === 'ondark');
</script>

<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
  <PlayBadge {variant} />

  {#if qr}
    <!-- Scan-to-install — only useful on a larger screen, hidden on phones. -->
    <div class="hidden items-center gap-2 lg:flex">
      <div class="h-16 w-16 overflow-hidden rounded-md ring-1 {dark ? 'ring-white/15' : 'ring-line'}">
        <QrPlay />
      </div>
      <span class="text-xs leading-tight {dark ? 'text-paper/60' : 'text-dim'}">Scan to<br />install</span>
    </div>
  {/if}
</div>
