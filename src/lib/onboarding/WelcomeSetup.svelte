<script>
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import OnboardingModal from './OnboardingModal.svelte';
  import SetupPlan from './SetupPlan.svelte';
  import { ONBOARDING_METADATA_KEY, PREFERENCE_QUERY_KEYS, preferencesFromSearch, preferencesFromUser, validatePreferences } from './preferences.js';

  let { supabase, onpreferences } = $props();
  let preferences = $state(null);
  let pending = $state(null);
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
      if (pending) await save(pending);
      else isOpen = !preferences;
    } catch (cause) {
      error = cause.message;
    } finally {
      isLoading = false;
    }
  }

  async function save(answers) {
    isSaving = true;
    error = '';
    pending = answers;
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
      isOpen = false;
    } catch (cause) {
      error = `Couldn’t save your setup: ${cause.message}`;
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
    <SetupPlan {preferences} isSignedIn={true} isSaved={true} onchange={change} onupdate={save} isUpdating={isSaving} />
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
      <button onclick={() => pending ? save(pending) : load()} disabled={isSaving} class="ml-2 min-h-10 underline">{isSaving ? 'Saving…' : 'Try again'}</button>
    </div>
  {/if}
</div>

{#if isOpen}
  <OnboardingModal initial={preferences} {initialStep} oncomplete={save} onclose={() => isOpen = false} {isSaving} {error} />
{/if}
