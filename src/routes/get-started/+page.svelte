<script>
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import MarketingHeader from '$lib/MarketingHeader.svelte';
  import OnboardingModal from '$lib/onboarding/OnboardingModal.svelte';
  import SetupPlan from '$lib/onboarding/SetupPlan.svelte';
  import { GET_STARTED_PATH, PREFERENCE_QUERY_KEYS, preferencesFromSearch, preferencesFromStorage, preferencesPath, storePreferences, USAGE } from '$lib/onboarding/preferences.js';

  let preferences = $state(null);
  let isOpen = $state(false);
  let initialStep = $state(0);
  let initialUsage = $state('');
  let isSignedIn = $state(false);

  onMount(async () => {
    const params = new URLSearchParams(location.search);
    const linkedPreferences = preferencesFromSearch(params);
    const hasPreferenceQuery = PREFERENCE_QUERY_KEYS.some((key) => params.has(key));
    preferences = linkedPreferences ?? (hasPreferenceQuery ? null : preferencesFromStorage(localStorage));
    if (linkedPreferences) storePreferences(localStorage, linkedPreferences);
    if (Object.values(USAGE).includes(params.get('usage'))) initialUsage = params.get('usage');
    isOpen = !preferences;
    const { createSupabase } = await import('$lib/supabase');
    const { data } = await createSupabase().auth.getSession();
    isSignedIn = Boolean(data.session);
  });

  function complete(answers) {
    preferences = storePreferences(localStorage, answers);
    replaceState(preferencesPath(GET_STARTED_PATH, answers), page.state);
    isOpen = false;
  }

  function change(step = 0) {
    initialStep = step;
    isOpen = true;
  }

  function update(answers) {
    preferences = storePreferences(localStorage, answers);
    replaceState(preferencesPath(GET_STARTED_PATH, answers), page.state);
  }
</script>

<svelte:head>
  <title>Your setup · Supaclank</title>
  <meta name="description" content="Find your way to build with Clank. Web or mobile apps, from your laptop or phone, locally or in the cloud." />
</svelte:head>

<MarketingHeader signedIn={isSignedIn} />

<main class="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col justify-center px-5 py-10 sm:py-16">
  {#if preferences}
    <h1 class="sr-only">Your Clank setup</h1>
    <SetupPlan {preferences} {isSignedIn} isSaved={false} onchange={change} onupdate={update} />
  {:else}
    <section class="rounded-3xl border border-line bg-elevated px-6 py-12 text-center sm:px-12">
      <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">What will you build?</h1>
      <p class="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">Tell us what you have in mind. We’ll point you to the right tools, whether that’s a quick install or a cloud workspace.</p>
      <button onclick={() => isOpen = true} class="mt-7 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-muted">Find my setup <span aria-hidden="true" class="ml-2">→</span></button>
      <p class="mt-4 text-xs text-dim">Three quick questions. No account needed.</p>
    </section>
  {/if}
</main>

{#if isOpen}
  <OnboardingModal initial={preferences} {initialUsage} {initialStep} oncomplete={complete} onclose={() => isOpen = false} />
{/if}
