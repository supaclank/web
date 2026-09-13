<script module>
  export const PREVIEW_KIND = { web: 'web', expo: 'expo' };
</script>

<script>
  import { renderSVG } from 'uqr';
  import Icon from './Icon.svelte';

  let { kind, previewURL, isStarting, logs, frameVersion } = $props();
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.supaclank.clank';
  const PREVIEW_LINK_PREFIX = 'clank://preview?url=';
  let isCopied = $state(false);
  let copyError = $state('');
  let phoneLink = $derived(kind === PREVIEW_KIND.expo && previewURL ? PREVIEW_LINK_PREFIX + encodeURIComponent(previewURL) : '');
  let qrImage = $derived(phoneLink ? `data:image/svg+xml,${encodeURIComponent(renderSVG(phoneLink, { border: 4, ecc: 'M' }))}` : '');
  let embeddedURL = $derived.by(() => {
    if (kind !== PREVIEW_KIND.web || !previewURL) return '';
    const url = new URL(previewURL);
    url.searchParams.set('__clank_embed', '1');
    return url.toString();
  });

  $effect(() => { phoneLink; isCopied = false; copyError = ''; });

  async function copyPhoneLink() {
    try {
      await navigator.clipboard.writeText(phoneLink);
      isCopied = true;
      copyError = '';
    } catch {
      copyError = 'Couldn’t copy the link. Scan the QR code with Clank instead.';
    }
  }
</script>

{#if kind === PREVIEW_KIND.expo}
  <div class="preview-empty phone-preview">
    <h3>Your app runs on your phone.</h3>
    <p>Install Clank while your agent builds, then scan the code to open your app.</p>
    <a class="quiet-button" href={PLAY_STORE_URL} target="_blank" rel="noreferrer">Get Clank for Android <Icon name="external" size={14} /></a>
    {#if phoneLink}
      <figure class="phone-preview-code">
        <img src={qrImage} alt="QR code to open this preview in Clank" width="224" height="224" />
        <figcaption>Scan with Clank</figcaption>
      </figure>
      <div class="phone-preview-actions">
        <a class="primary-button" href={phoneLink}>Open in Clank</a>
        <button class="text-button" onclick={copyPhoneLink}>{isCopied ? 'Phone link copied' : 'Copy phone link'}</button>
      </div>
      {#if copyError}<p role="alert">{copyError}</p>{/if}
    {:else}
      <p class="phone-preview-waiting" role="status">Your QR code will appear when the preview is ready.</p>
    {/if}
    {#if !previewURL}
      <details class="preview-build-output"><summary>Build output</summary><pre class="preview-logs">{logs || 'Waiting for the dev server…'}</pre></details>
    {/if}
  </div>
{:else if embeddedURL}
  {#key frameVersion}
    <iframe src={embeddedURL} title="Live app preview" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads" referrerpolicy="no-referrer"></iframe>
  {/key}
{:else}
  <div class="preview-empty">
    <div class="empty-preview-geometry" aria-hidden="true"><Icon name="web" size={34} /></div>
    <h3>Your idea is taking shape.</h3>
    <p>{isStarting ? 'Preparing the live preview. The first start can take a few minutes.' : 'Your app will appear here.'}</p>
    <details class="preview-build-output"><summary>Build output</summary><pre class="preview-logs">{logs || 'Waiting for the dev server…'}</pre></details>
  </div>
{/if}
