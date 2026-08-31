<script>
  import '../app.css';
  import { browser } from '$app/environment';
  import { beforeNavigate } from '$app/navigation';
  import { initAnalytics } from '$lib/analytics.js';
  import { shouldReloadForAnalyticsRecordingNavigation } from '$lib/analytics-script.js';

  let { children } = $props();

  // No-op unless both Umami and the current production hostname are configured.
  if (browser && initAnalytics()) {
    // Umami's recorder persists across history navigation and has no public stop API.
    // Reload at the recording boundary so it never observes a private or queried URL.
    beforeNavigate(({ from, to, willUnload, cancel }) => {
      if (willUnload || !from?.url || !to?.url) return;
      if (!shouldReloadForAnalyticsRecordingNavigation(from.url, to.url)) return;

      cancel();
      location.assign(to.url.href);
    });
  }
</script>

{@render children()}
