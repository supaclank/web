<script>
  import { repositoryInputPath } from './preferences.js';
  let { onopen } = $props();
  let repository = $state('');
  let error = $state('');

  async function openRepository(event) {
    event.preventDefault();
    try {
      const path = repositoryInputPath(repository);
      // Await the tracking call so it isn't dropped by the hard navigation below,
      // but a tracking failure must not block a valid repository submission.
      try {
        await onopen?.();
      } catch {
        // ignore
      }
      location.assign(path);
    } catch (cause) {
      error = cause.message;
    }
  }
</script>

<form onsubmit={openRepository} class="mt-4">
  <label for="onboarding-repository" class="text-xs font-medium">GitHub repository</label>
  <div class="mt-1.5 flex flex-col gap-2 sm:flex-row">
    <input id="onboarding-repository" bind:value={repository} required placeholder="owner/repository or GitHub URL" autocapitalize="none" spellcheck="false" class="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-brand" />
    <button class="rounded-lg bg-brand px-4 py-3 text-sm font-medium text-white hover:bg-brand-muted">Continue <span aria-hidden="true">→</span></button>
  </div>
  {#if error}<p role="alert" class="mt-2 text-sm text-danger">{error}</p>{/if}
</form>
