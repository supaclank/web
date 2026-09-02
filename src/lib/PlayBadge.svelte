<script>
  // Inline "Get it on Google Play" badge (asset-light — no image request).
  // variant: 'onlight' = dark badge for light backgrounds, 'ondark' = light.
  // size: 'md' (default) or 'sm' (compact, e.g. inside the phone preview).
  let { variant = 'onlight', size = 'md', tabindex = undefined, onclick } = $props();

  const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.supaclank.clank';
  let dark = $derived(variant === 'onlight');
  let sm = $derived(size === 'sm');

  // Plain clicks would otherwise unload the page before the async tracking
  // call finishes; hold the navigation until it settles. Modified clicks
  // (new tab, etc.) are left to the browser's default handling untouched.
  async function handleClick(event) {
    if (!onclick) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      onclick();
      return;
    }
    event.preventDefault();
    await onclick();
    location.href = PLAY_URL;
  }
</script>

<a
  href={PLAY_URL}
  rel="noreferrer"
  {tabindex}
  onclick={handleClick}
  aria-label="Get it on Google Play"
  class="inline-flex items-center shadow-sm ring-1 transition-transform hover:-translate-y-0.5 {sm
    ? 'gap-2 rounded-lg px-3 py-1.5'
    : 'gap-2.5 rounded-xl px-4 py-2.5'} {dark
    ? 'bg-ink text-paper ring-black/10'
    : 'bg-paper text-ink ring-black/5'}"
>
  <svg class="{sm ? 'h-5 w-5' : 'h-7 w-7'} shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#00d2ff" d="M1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924z" />
    <path fill="#ff424b" d="M13.544 10.989l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973z" />
    <path fill="#00dc78" d="M13.544 13.056l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
    <path fill="#ffce00" d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594z" />
  </svg>
  <span class="flex flex-col text-left leading-none">
    <span class="{sm ? 'text-[7px]' : 'text-[9px]'} font-medium tracking-wider uppercase opacity-75"
      >Get it on</span
    >
    <span class="-mt-px {sm ? 'text-[13px]' : 'text-[17px]'} font-semibold tracking-tight"
      >Google Play</span
    >
  </span>
</a>
