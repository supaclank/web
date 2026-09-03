<script>
  import { tick, untrack } from 'svelte';
  import ChoiceCard from './ChoiceCard.svelte';
  import { BUILD_TARGET, DEVICE, USAGE, ONBOARDING_VERSION } from './preferences.js';

  let {
    initial = null,
    initialUsage = '',
    initialStep = 0,
    oncomplete,
    oncancel = null,
    isSaving = false,
    error = ''
  } = $props();

  const STEPS = ['Build', 'Devices', 'Setup'];
  let step = $state(untrack(() => initialStep));
  let buildTargets = $state(untrack(() => initial ? [...initial.buildTargets] : []));
  let devices = $state(untrack(() => initial ? [...initial.devices] : []));
  let usage = $state(
    untrack(() => initial?.usage ?? (Object.values(USAGE).includes(initialUsage) ? initialUsage : ''))
  );
  let heading;
  let canContinue = $derived(
    step === 0 ? buildTargets.length > 0 : step === 1 ? devices.length > 0 : Boolean(usage)
  );

  // The route learns query-string defaults on mount; adopt that late value
  // only while this question has not yet been answered.
  $effect(() => {
    if (!usage && Object.values(USAGE).includes(initialUsage)) usage = initialUsage;
  });

  function toggle(values, value) {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  }

  async function moveStep(next) {
    step = next;
    await tick();
    heading.focus();
  }

  function continueSetup() {
    if (!canContinue || isSaving) return;
    if (step < STEPS.length - 1) return moveStep(step + 1);
    oncomplete({ version: ONBOARDING_VERSION, buildTargets, devices, usage });
  }
</script>

<section aria-labelledby="onboarding-heading" class="onboarding-card rounded-2xl border border-line bg-elevated p-6 sm:p-8">
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      <h1
        id="onboarding-heading"
        bind:this={heading}
        tabindex="-1"
        class="text-xl font-semibold tracking-tight outline-none sm:text-2xl"
      >
        {step === 0
          ? 'What do you want to build?'
          : step === 1
            ? 'Where do you want to build?'
            : 'Where should your code run?'}
      </h1>
      <p class="mt-1.5 text-sm text-muted">
        {step === 2 ? 'Pick one to start with.' : 'Select one or both.'}
      </p>
    </div>

    {#if oncancel}
      <button
        type="button"
        onclick={oncancel}
        disabled={isSaving}
        aria-label="Return to your setup"
        class="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center text-dim hover:text-ink disabled:opacity-40"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
      </button>
    {/if}
  </div>

  <div class="mt-5 grid grid-cols-3 gap-2" aria-hidden="true">
    {#each STEPS as _, index}
      <span class="h-1 rounded-full {index <= step ? 'bg-brand' : 'bg-line'}"></span>
    {/each}
  </div>

  <fieldset disabled={isSaving} class="mt-6 grid grid-cols-2 gap-4 sm:gap-5">
    <legend class="sr-only">{STEPS[step]}. {step < 2 ? 'Select one or both.' : 'Select one.'}</legend>
    {#if step === 0}
      <ChoiceCard kind={BUILD_TARGET.web} title="Web apps" type="checkbox" name="build" checked={buildTargets.includes(BUILD_TARGET.web)} onchange={() => buildTargets = toggle(buildTargets, BUILD_TARGET.web)} />
      <ChoiceCard kind={BUILD_TARGET.mobile} title="Mobile apps" type="checkbox" name="build" checked={buildTargets.includes(BUILD_TARGET.mobile)} onchange={() => buildTargets = toggle(buildTargets, BUILD_TARGET.mobile)} />
    {:else if step === 1}
      <ChoiceCard kind={DEVICE.laptop} title="Computer" type="checkbox" name="devices" checked={devices.includes(DEVICE.laptop)} onchange={() => devices = toggle(devices, DEVICE.laptop)} />
      <ChoiceCard kind={DEVICE.mobile} title="Phone" type="checkbox" name="devices" checked={devices.includes(DEVICE.mobile)} onchange={() => devices = toggle(devices, DEVICE.mobile)} showInterface={false} />
    {:else}
      <ChoiceCard kind={USAGE.local} title="Locally" caption="Free · Keep your computer on" type="radio" name="usage" checked={usage === USAGE.local} onchange={() => usage = USAGE.local} />
      <ChoiceCard kind={USAGE.cloud} title="Cloud sandbox" caption="7-day trial · Always online" type="radio" name="usage" checked={usage === USAGE.cloud} onchange={() => usage = USAGE.cloud} />
    {/if}
  </fieldset>

  {#if error}<p role="alert" class="mt-4 text-sm text-danger">{error}</p>{/if}

  <div class="mt-5 flex min-h-11 items-center justify-end gap-4">
    {#if step > 0}
      <button
        type="button"
        onclick={() => moveStep(step - 1)}
        disabled={isSaving}
        class="mr-auto min-h-11 text-sm text-muted hover:text-ink disabled:opacity-40"
      >Back</button>
    {/if}
    <button
      type="button"
      onclick={continueSetup}
      disabled={!canContinue || isSaving}
      class="inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed {step === 2 ? 'bg-brand text-white hover:bg-brand-muted disabled:bg-line' : 'bg-ink text-paper hover:opacity-90 disabled:bg-line disabled:text-dim'}"
    >
      {isSaving ? 'Saving…' : step === 2 ? 'Show my setup' : 'Continue'}
      <span aria-hidden="true" class="ml-2">→</span>
    </button>
  </div>
</section>

<style>
  .onboarding-card {
    background: rgba(255, 255, 255, 0.94);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.9) inset,
      0 1px 2px rgba(26, 23, 20, 0.08),
      0 20px 55px rgba(26, 23, 20, 0.12);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
  }
</style>
