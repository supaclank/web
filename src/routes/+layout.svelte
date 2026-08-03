<script>
  import '../app.css';
  import { browser } from '$app/environment';
  import { initAnalytics } from '$lib/analytics.js';

  let { children } = $props();

  // No-op unless this is running in the browser on the configured analytics domain.
  if (browser) initAnalytics();
</script>

{@render children()}
