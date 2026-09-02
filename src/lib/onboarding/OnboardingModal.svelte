<script>
  import { onMount, tick } from 'svelte';
  import ChoiceCard from './ChoiceCard.svelte';
  import { BUILD_TARGET, DEVICE, USAGE, ONBOARDING_VERSION } from './preferences.js';

  let { initial = null, initialUsage = '', initialStep = 0, oncomplete, onclose, isSaving = false, error = '' } = $props();
  const STEPS = ['Build', 'Devices', 'Setup'];
  let step = $state(0);
  let buildTargets = $state([]);
  let devices = $state([]);
  let usage = $state('');
  let dialog;
  let heading;
  let canContinue = $derived(step === 0 ? buildTargets.length > 0 : step === 1 ? devices.length > 0 : Boolean(usage));

  onMount(() => {
    step = initialStep;
    if (initial) {
      buildTargets = [...initial.buildTargets];
      devices = [...initial.devices];
      usage = initial.usage;
    } else if (Object.values(USAGE).includes(initialUsage)) {
      usage = initialUsage;
    }
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    heading.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  });

  function toggle(values, value) {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  }

  async function moveStep(next) {
    step = next;
    await tick();
    heading.focus();
    dialog.scrollTop = 0;
  }

  function continueSetup() {
    if (!canContinue || isSaving) return;
    if (step < STEPS.length - 1) return moveStep(step + 1);
    oncomplete({ version: ONBOARDING_VERSION, buildTargets, devices, usage });
  }
</script>

<dialog bind:this={dialog} aria-labelledby="onboarding-heading"
  oncancel={(event) => { event.preventDefault(); if (!isSaving) onclose(); }}
  class="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border-0 bg-white p-0 text-ink shadow-xl outline-none">
  <div class="p-6 sm:p-8">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 id="onboarding-heading" bind:this={heading} tabindex="-1" class="pt-1 text-xl font-medium tracking-tight outline-none sm:text-2xl">
          {step === 0 ? 'What do you want to build?' : step === 1 ? 'From where do you want to build?' : 'Where should your code run?'}
        </h1>
        {#if step === 2}<p class="mt-1.5 text-sm text-muted">Pick one to start with</p>{/if}
      </div>
      <button onclick={onclose} disabled={isSaving} aria-label="Close onboarding" class="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center text-dim hover:text-ink disabled:opacity-40">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
      </button>
    </div>

    <fieldset disabled={isSaving} class="mt-7 grid grid-cols-2 gap-6">
      <legend class="sr-only">{STEPS[step]}. {step < 2 ? 'Select one or both.' : 'Select one.'}</legend>
      {#if step === 0}
        <ChoiceCard kind={BUILD_TARGET.web} title="Web apps" type="checkbox" name="build" checked={buildTargets.includes(BUILD_TARGET.web)} onchange={() => buildTargets = toggle(buildTargets, BUILD_TARGET.web)} />
        <ChoiceCard kind={BUILD_TARGET.mobile} title="Mobile apps" type="checkbox" name="build" checked={buildTargets.includes(BUILD_TARGET.mobile)} onchange={() => buildTargets = toggle(buildTargets, BUILD_TARGET.mobile)} />
      {:else if step === 1}
        <ChoiceCard kind={DEVICE.laptop} title="Computer" type="checkbox" name="devices" checked={devices.includes(DEVICE.laptop)} onchange={() => devices = toggle(devices, DEVICE.laptop)} />
        <ChoiceCard kind={DEVICE.mobile} title="Phone" type="checkbox" name="devices" checked={devices.includes(DEVICE.mobile)} onchange={() => devices = toggle(devices, DEVICE.mobile)} showInterface={false} />
      {:else}
        <ChoiceCard kind={USAGE.local} title="Locally" caption="Free · No account" type="radio" name="usage" checked={usage === USAGE.local} onchange={() => usage = USAGE.local} />
        <ChoiceCard kind={USAGE.cloud} title="Cloud sandbox" caption="7-day free trial" type="radio" name="usage" checked={usage === USAGE.cloud} onchange={() => usage = USAGE.cloud} />
      {/if}
    </fieldset>

    {#if error}<p role="alert" class="mt-4 text-sm text-danger">{error}</p>{/if}

    <div class="mt-5 flex items-center justify-end gap-4">
      {#if step > 0}
        <button onclick={() => moveStep(step - 1)} disabled={isSaving} class="mr-auto min-h-11 text-sm text-muted hover:text-ink disabled:opacity-40">Back</button>
      {/if}
      <button type="button" onclick={continueSetup} disabled={!canContinue || isSaving} class="inline-flex min-h-11 items-center justify-center text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:text-dim {step === 2 ? 'rounded-xl bg-brand px-5 py-2.5 text-white hover:bg-brand-muted disabled:bg-line' : 'text-ink hover:text-brand-muted'}">
        {isSaving ? 'Saving…' : step === 2 ? 'Show my setup' : 'Continue'} <span aria-hidden="true" class="ml-2">→</span>
      </button>
    </div>
  </div>
</dialog>

<style>
  dialog::backdrop { background: rgb(26 23 20 / 24%); backdrop-filter: blur(3px); }
</style>
