<script>
  import GetApp from '$lib/GetApp.svelte';
  import ChoiceCard from './ChoiceCard.svelte';
  import CopyCommand from './CopyCommand.svelte';
  import RepositoryEntry from './RepositoryEntry.svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { ONBOARDING_ACTION, onboardingProperties, onboardingActionProperties } from './analytics-properties.js';
  import { BUILD_TARGET, DEVICE, USAGE, INSTALL_COMMAND, PREVIEW_COMMAND, PAIR_COMMAND, setupNeeds, setupContinuation, signupPath } from './preferences.js';

  let { placement, preferences, isSignedIn, isSaved, onchange, onupdate, isUpdating = false } = $props();
  let needs = $derived(setupNeeds(preferences));
  let isLocal = $derived(preferences.usage === USAGE.local);
  let hasMobileTarget = $derived(preferences.buildTargets.includes(BUILD_TARGET.mobile));
  let hasWebTarget = $derived(preferences.buildTargets.includes(BUILD_TARGET.web));
  let needsAccountStep = $derived(!isLocal && !isSaved);
  let continuation = $derived(setupContinuation(preferences, isSignedIn));
  let cloudSignupHref = $derived(signupPath({ ...preferences, usage: USAGE.cloud }));
  let buildChoiceLabel = $derived(preferences.buildTargets.map((target) => target === BUILD_TARGET.web ? 'Web apps' : 'Mobile apps').join(' + '));
  let deviceChoiceLabel = $derived(preferences.devices.map((device) => device === DEVICE.laptop ? 'Computer' : 'Phone').join(' + '));
  let activeChoice = $state('usage');
  let previousView = '';

  $effect(() => {
    const properties = onboardingProperties(placement, preferences);
    const view = JSON.stringify(properties);
    if (view === previousView) return;
    previousView = view;
    trackEvent(analyticsEvents.onboardingSetupViewed, properties);
  });

  function reportAction(action) {
    trackEvent(analyticsEvents.onboardingAction, onboardingActionProperties(placement, preferences, action));
  }

  function toggle(values, value) {
    if (values.includes(value)) return values.length > 1 ? values.filter((item) => item !== value) : values;
    return [...values, value];
  }

  function updateBuild(target) {
    onupdate({ ...preferences, buildTargets: toggle(preferences.buildTargets, target) });
  }

  function updateDevice(device) {
    onupdate({ ...preferences, devices: toggle(preferences.devices, device) });
  }

  function updateUsage(usage) {
    onupdate({ ...preferences, usage });
  }
</script>

<section aria-labelledby="setup-plan-heading" class="rounded-3xl border border-line bg-elevated shadow-sm">
  <div class="border-b border-line-subtle p-6 sm:p-8">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 id="setup-plan-heading" class="text-2xl font-semibold tracking-tight">{isLocal ? 'Make your laptop the workspace.' : 'Your workspace, wherever you are.'}</h2>
      </div>
      <button onclick={() => onchange(0)} class="-mr-2 min-h-11 shrink-0 rounded-lg px-2 text-xs text-muted underline decoration-line underline-offset-4 hover:text-ink">Change</button>
    </div>
    <p class="mt-3 text-sm leading-relaxed text-muted">
      {isLocal ? 'Everything runs on your computer. Free and open source. No account needed.' : isSaved ? 'Your setup is saved. Follow the steps below to start building.' : isSignedIn ? 'Save these choices to your account and continue setting up your workspace.' : 'Start with 7 days free. Just sign up!'}
    </p>
    <ul aria-label="Your choices" class="mt-4 flex flex-wrap gap-2 text-xs text-muted">
      <li><button type="button" aria-expanded={activeChoice === 'build'} onclick={() => activeChoice = activeChoice === 'build' ? null : 'build'} class="inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 transition-colors {activeChoice === 'build' ? 'border-brand text-ink' : 'border-line text-muted hover:border-ink/25 hover:text-ink'}"><span class={activeChoice === 'build' ? 'text-brand-muted' : 'text-dim'}>Build ·</span>{buildChoiceLabel}</button></li>
      <li><button type="button" aria-expanded={activeChoice === 'device'} onclick={() => activeChoice = activeChoice === 'device' ? null : 'device'} class="inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 transition-colors {activeChoice === 'device' ? 'border-brand text-ink' : 'border-line text-muted hover:border-ink/25 hover:text-ink'}"><span class={activeChoice === 'device' ? 'text-brand-muted' : 'text-dim'}>From ·</span>{deviceChoiceLabel}</button></li>
      <li><button type="button" aria-expanded={activeChoice === 'usage'} onclick={() => activeChoice = activeChoice === 'usage' ? null : 'usage'} class="inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 transition-colors {activeChoice === 'usage' ? 'border-brand text-ink' : 'border-line text-muted hover:border-ink/25 hover:text-ink'}"><span class={activeChoice === 'usage' ? 'text-brand-muted' : 'text-dim'}>Run ·</span>{isLocal ? 'Locally · Free' : 'Cloud sandbox'}</button></li>
    </ul>
    {#if activeChoice}
      <fieldset disabled={isUpdating} class="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
        <legend class="sr-only">Change {activeChoice} choice</legend>
        {#if activeChoice === 'build'}
          <ChoiceCard kind={BUILD_TARGET.web} title="Web apps" type="checkbox" name="inline-build" checked={preferences.buildTargets.includes(BUILD_TARGET.web)} onchange={() => updateBuild(BUILD_TARGET.web)} />
          <ChoiceCard kind={BUILD_TARGET.mobile} title="Mobile apps" type="checkbox" name="inline-build" checked={preferences.buildTargets.includes(BUILD_TARGET.mobile)} onchange={() => updateBuild(BUILD_TARGET.mobile)} />
        {:else if activeChoice === 'device'}
          <ChoiceCard kind={DEVICE.laptop} title="Computer" type="checkbox" name="inline-device" checked={preferences.devices.includes(DEVICE.laptop)} onchange={() => updateDevice(DEVICE.laptop)} />
          <ChoiceCard kind={DEVICE.mobile} title="Phone" type="checkbox" name="inline-device" checked={preferences.devices.includes(DEVICE.mobile)} onchange={() => updateDevice(DEVICE.mobile)} showInterface={false} />
        {:else}
          <ChoiceCard kind={USAGE.local} title="Locally" caption="Free · No account" type="radio" name="inline-usage" checked={preferences.usage === USAGE.local} onchange={() => updateUsage(USAGE.local)} />
          <ChoiceCard kind={USAGE.cloud} title="Cloud sandbox" caption="7-day free trial" type="radio" name="inline-usage" checked={preferences.usage === USAGE.cloud} onchange={() => updateUsage(USAGE.cloud)} />
        {/if}
      </fieldset>
    {/if}
  </div>

  <ol class="setup-steps space-y-7 p-6 sm:p-8">
    {#if needsAccountStep}
      <li>
        <h3>{isSignedIn ? 'Continue with your account' : 'Create your cloud account'}</h3>
        {#if isSignedIn}<p>Keep your personalized setup with your account so it’s ready next time you sign in.</p>{/if}
        <a href={continuation.href} onclick={() => reportAction(isSignedIn ? ONBOARDING_ACTION.saveAccount : ONBOARDING_ACTION.cloudSignup)} class="mt-4 inline-flex min-h-11 items-center gap-3 rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand-muted">{continuation.label} <span aria-hidden="true">→</span></a>
      </li>
    {/if}

    {#if needsAccountStep && needs.openComputerWorkspace}
      <li>
        <h3>Open your cloud sandbox</h3>
        <p>After signup, create a project or import a GitHub repository from your browser.</p>
      </li>
    {/if}

    {#if needs.installCLI}
      <li>
        <h3>Install Clank on your laptop</h3>
        <p>Run this in your terminal with Homebrew installed.</p>
        <CopyCommand command={INSTALL_COMMAND} oncopied={() => reportAction(ONBOARDING_ACTION.copyInstall)} />
        {#if needs.needsLaptopReminder}<p class="mt-3 rounded-lg bg-surface p-3">Even when you work from your phone, this laptop needs to stay on and reachable. <a href={cloudSignupHref} onclick={() => reportAction(ONBOARDING_ACTION.cloudSignup)} class="font-medium text-brand-muted underline underline-offset-4">Sign up for a cloud sandbox, and peace of mind.</a></p>{/if}
      </li>
    {/if}

    {#if needs.downloadApp}
      <li>
        <h3>Get Clank on your phone</h3>
        {#if !hasMobileTarget}
          <p>Open your web previews and work with your agents from the Clank app.{#if !isLocal} Sign in with the same Supaclank account.{/if}</p>
        {:else if !isLocal}
          <p>Sign in with the same Supaclank account.</p>
        {/if}
        <div class="mt-4"><GetApp qr qrPosition="right" onopenstore={() => reportAction(ONBOARDING_ACTION.appDownload)} onshowqr={() => reportAction(ONBOARDING_ACTION.appQrShown)} /></div>
      </li>
    {/if}

    {#if needs.pairPhone}
      <li>
        <h3>Connect your phone to your laptop</h3>
        <CopyCommand command={PAIR_COMMAND} oncopied={() => reportAction(ONBOARDING_ACTION.copyPair)} />
      </li>
    {/if}

    {#if isLocal}
      <li>
        <h3>Open your project and start a preview</h3>
        <p>In your project folder, run:</p>
        <CopyCommand command={PREVIEW_COMMAND} oncopied={() => reportAction(ONBOARDING_ACTION.copyPreview)} />
        {#if hasWebTarget}<p class="mt-3">For web apps, open the browser preview and press ⌘E / Ctrl+E to start editing.</p>{/if}
        {#if hasMobileTarget}<p class="mt-3">For Expo apps, open the preview in Clank on your phone. Shake to bring up the editor.</p>{/if}
      </li>
    {:else if isSaved}
      {#if needs.openComputerWorkspace}
        <li>
          <h3>Open a project in your browser</h3>
          <p>Choose a GitHub repository. You’ll connect GitHub and review it before creating a cloud workspace.</p>
          <RepositoryEntry onopen={() => reportAction(ONBOARDING_ACTION.openRepository)} />
        </li>
      {/if}
      {#if needs.downloadApp}
        <li>
          <h3>{hasMobileTarget ? 'Start your app on your phone' : 'Open a project on your phone'}</h3>
          <p>In Clank, create a project or import a repository, connect your preferred coding agent, and describe what you want to build.</p>
        </li>
      {/if}
    {/if}
  </ol>
  {#if isLocal && isSignedIn && !isSaved}
    <div class="border-t border-line-subtle p-6 sm:px-8">
      <a href={continuation.href} onclick={() => reportAction(ONBOARDING_ACTION.saveAccount)} class="text-sm font-medium text-brand-muted underline underline-offset-4">Save this setup to my account</a>
    </div>
  {/if}
</section>

<style>
  .setup-steps { counter-reset: step; }
  .setup-steps > li { counter-increment: step; position: relative; padding-left: 2.5rem; }
  .setup-steps > li::before { content: counter(step); position: absolute; left: 0; top: -1px; display: grid; place-items: center; width: 1.65rem; height: 1.65rem; border-radius: 50%; background: var(--color-surface); color: var(--color-muted); font: 500 12px var(--font-mono); }
  .setup-steps h3 { font-size: 0.875rem; font-weight: 600; line-height: 1.5; }
  .setup-steps p { margin-top: 0.35rem; font-size: 0.875rem; line-height: 1.65; color: var(--color-muted); }
  @media (max-width: 420px) { .setup-steps > li { padding-left: 0; } .setup-steps > li::before { position: static; margin-bottom: 0.6rem; } }
</style>
