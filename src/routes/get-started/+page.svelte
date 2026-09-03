<script>
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import CorridorPage from '$lib/CorridorPage.svelte';
  import OnboardingCard from '$lib/onboarding/OnboardingCard.svelte';
  import SetupPlan from '$lib/onboarding/SetupPlan.svelte';
  import { GET_STARTED_PATH, PREFERENCE_QUERY_KEYS, preferencesFromSearch, preferencesFromStorage, preferencesPath, storePreferences, USAGE } from '$lib/onboarding/preferences.js';

  let preferences = $state(null);
  let isOpen = $state(true);
  let initialStep = $state(0);
  let initialUsage = $state('');
  let isSignedIn = $state(false);

  // Referencing localStorage itself (not just its methods) can throw in some
  // browsers' private-browsing modes.
  function safeStorage() {
    try {
      return localStorage;
    } catch {
      return null;
    }
  }

  onMount(async () => {
    const params = new URLSearchParams(location.search);
    const linkedPreferences = preferencesFromSearch(params);
    const hasPreferenceQuery = PREFERENCE_QUERY_KEYS.some((key) => params.has(key));
    preferences = linkedPreferences ?? (hasPreferenceQuery ? null : preferencesFromStorage(safeStorage()));
    if (linkedPreferences) storePreferences(safeStorage(), linkedPreferences);
    if (Object.values(USAGE).includes(params.get('usage'))) initialUsage = params.get('usage');
    isOpen = !preferences;
    const { createSupabase } = await import('$lib/supabase');
    const { data } = await createSupabase().auth.getSession();
    isSignedIn = Boolean(data.session);
  });

  function complete(answers) {
    preferences = storePreferences(safeStorage(), answers);
    replaceState(preferencesPath(GET_STARTED_PATH, answers), page.state);
    isOpen = false;
  }

  function change(step = 0) {
    initialStep = step;
    isOpen = true;
  }

  function cancelChange() {
    isOpen = false;
  }

  function update(answers) {
    preferences = storePreferences(safeStorage(), answers);
    replaceState(preferencesPath(GET_STARTED_PATH, answers), page.state);
  }
</script>

<svelte:head>
  <title>Your setup · Supaclank</title>
  <meta name="description" content="Find your way to build with Clank. Web or mobile apps, from your laptop or phone, locally or in the cloud." />
</svelte:head>

<CorridorPage width="wide">
  {#if isOpen}
    <div class="mx-auto max-w-lg">
      <OnboardingCard
        initial={preferences}
        {initialUsage}
        {initialStep}
        oncomplete={complete}
        oncancel={preferences ? cancelChange : null}
      />
      {#if !preferences}
        <p class="flow-note mt-5 text-center text-xs text-muted">Three quick questions. No account needed.</p>
      {/if}
    </div>
  {:else if preferences}
    <h1 class="sr-only">Your Clank setup</h1>
    <SetupPlan {preferences} {isSignedIn} isSaved={false} onchange={change} onupdate={update} />
  {/if}
</CorridorPage>

<style>
  .flow-note {
    width: fit-content;
    margin-right: auto;
    margin-left: auto;
    padding: 0.4rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.62);
    border-radius: 999px;
    background: rgba(250, 248, 244, 0.78);
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
  }
</style>
