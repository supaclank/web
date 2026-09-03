<script>
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import OnboardingModal from './OnboardingModal.svelte';
  import SetupPlan from './SetupPlan.svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { ONBOARDING_PLACEMENT, ONBOARDING_SAVE_SOURCE, onboardingProperties } from './analytics-properties.js';
  import { ONBOARDING_METADATA_KEY, PREFERENCE_QUERY_KEYS, preferencesFromSearch, preferencesFromUser, validatePreferences } from './preferences.js';

  let { supabase, onpreferences } = $props();
  let preferences = $state(null);
  let pending = $state(null);
  let pendingSource = $state(null);
  let isLoading = $state(true);
  let isOpen = $state(false);
  let initialStep = $state(0);
  let isSaving = $state(false);
  let error = $state('');

  onMount(load);

  async function load() {
    isLoading = true;
    error = '';
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!data.user) throw new Error('Sign in again to load your setup.');
      preferences = preferencesFromUser(data.user);
      onpreferences(preferences);
      pending = preferencesFromSearch(new URLSearchParams(location.search));
      if (pending) await save(pending, ONBOARDING_SAVE_SOURCE.handoff);
      else isOpen = !preferences;
    } catch (cause) {
      error = cause.message;
    } finally {
      isLoading = false;
    }
  }

  async function save(answers, source) {
    const isEdit = Boolean(preferences);
    isSaving = true;
    error = '';
    pending = answers;
    pendingSource = source;
    try {
      const validated = validatePreferences(answers);
      const { data, error: saveError } = await supabase.auth.updateUser({ data: { [ONBOARDING_METADATA_KEY]: validated } });
      if (saveError) throw saveError;
      preferences = preferencesFromUser(data.user);
      if (!preferences) throw new Error('Your setup wasn’t saved. Please try again.');
      onpreferences(preferences);
      const url = new URL(location.href);
      for (const key of PREFERENCE_QUERY_KEYS) url.searchParams.delete(key);
      replaceState(url.pathname + url.search + url.hash, page.state);
      pending = null;
      pendingSource = null;
      isOpen = false;
      const properties = onboardingProperties(ONBOARDING_PLACEMENT.welcome, preferences);
      trackEvent(analyticsEvents.onboardingSaved, { ...properties, source });
      if (source === ONBOARDING_SAVE_SOURCE.modal) {
        trackEvent(analyticsEvents.onboardingCompleted, { ...properties, is_edit: isEdit });
      }
    } catch (cause) {
      error = `Couldn’t save your setup: ${cause.message}`;
      trackEvent(analyticsEvents.onboardingSaveFailed, { placement: ONBOARDING_PLACEMENT.welcome, source });
    } finally {
      isSaving = false;
    }
  }

  function change(step = 0) {
    initialStep = step;
    isOpen = true;
  }
</script>

<div class="mb-5">
  {#if isLoading}
    <p role="status" class="py-4 text-center text-sm text-muted">Loading your setup…</p>
  {:else if preferences}
    <SetupPlan placement={ONBOARDING_PLACEMENT.welcome} {preferences} isSignedIn={true} isSaved={true} onchange={change} onupdate={(answers) => save(answers, ONBOARDING_SAVE_SOURCE.inline)} isUpdating={isSaving} />
  {:else}
    <section class="rounded-2xl border border-line bg-elevated p-6">
      <h2 class="text-lg font-semibold">Let’s get you building.</h2>
      <p class="mt-1 text-sm text-muted">Choose your apps, devices, and workspace for a setup that fits you.</p>
      <button onclick={() => isOpen = true} class="mt-4 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-paper">Personalize my setup</button>
    </section>
  {/if}
  {#if error && !isOpen}
    <div role="alert" class="mt-3 rounded-xl border border-danger/30 p-4 text-sm text-danger">
      {error}
      <button onclick={() => pending ? save(pending, pendingSource) : load()} disabled={isSaving} class="ml-2 min-h-10 underline">{isSaving ? 'Saving…' : 'Try again'}</button>
    </div>
  {/if}
</div>

{#if isOpen}
  <OnboardingModal placement={ONBOARDING_PLACEMENT.welcome} initial={preferences} {initialStep} oncomplete={(answers) => save(answers, ONBOARDING_SAVE_SOURCE.modal)} onclose={() => isOpen = false} {isSaving} {error} />
{/if}
