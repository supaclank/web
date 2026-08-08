<script>
  import { onDestroy } from 'svelte';
  import QrPlay from '$lib/QrPlay.svelte';
  import PlayBadge from '$lib/PlayBadge.svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { CLOUD_MONTHLY_PLAN } from '$lib/pricing.js';

  // Each install action can swap its plan card for an in-place QR code.
  let showQr = $state(false);
  let showFreeQr = $state(false);

  // One click copies both shell commands without prompt characters.
  const FREE_CMDS = ['brew install supaclank/clank', 'clank preview'];
  let freeCmdsCopied = $state(false);
  let freeCmdsCopiedTimeout;
  onDestroy(() => clearTimeout(freeCmdsCopiedTimeout));
  async function copyFreeCmds() {
    try {
      await navigator.clipboard.writeText(FREE_CMDS.join('\n'));
    } catch {
      return;
    }
    trackEvent(analyticsEvents.installCommandsCopied, { placement: 'pricing' });
    freeCmdsCopied = true;
    clearTimeout(freeCmdsCopiedTimeout);
    freeCmdsCopiedTimeout = setTimeout(() => (freeCmdsCopied = false), 1500);
  }
  // Fleet interest is appended to the public Apps Script sheet endpoint.
  const WAITLIST_URL =
    'https://script.google.com/macros/s/AKfycby8jc16Ue661NyQUvqJDsbC4MK51D0874VQ_DxKAGOjrD4bPmIJBSTZNylo86GONcIm-g/exec';
  let waitlistEmail = $state('');
  let waitlistSending = $state(false);
  let waitlistJoined = $state(false);
  let waitlistError = $state(false);

  // The button can react to typing, while submission still requires valid email syntax.
  let waitlistEmailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail.trim()));
  let waitlistTyped = $derived(waitlistEmail.trim().length > 0);

  async function joinWaitlist(e) {
    e.preventDefault();
    const email = waitlistEmail.trim();
    if (!waitlistEmailValid || waitlistSending) return;
    waitlistSending = true;
    waitlistError = false;
    try {
      await fetch(WAITLIST_URL, {
        method: 'POST',
        mode: 'no-cors',
        redirect: 'follow',
        // [email, ISO timestamp, source] — array so Apps Script can appendRow().
        body: JSON.stringify([email, new Date().toISOString(), '/pricing#clank-fleet'])
      });
      trackEvent(analyticsEvents.fleetWaitlistSubmitted, { placement: 'pricing' });
      waitlistJoined = true;
    } catch (_) {
      waitlistError = true;
    } finally {
      waitlistSending = false;
    }
  }

  function revealInstallQr(plan) {
    trackEvent(analyticsEvents.installQrShown, { placement: 'pricing', plan });
    if (plan === 'free') showFreeQr = true;
    else showQr = true;
  }
</script>

<svelte:head>
  <title>Pricing: Supaclank</title>
  <meta
    name="description"
    content={`Supaclank pricing: free and open source with your own compute, a managed cloud plan for ${CLOUD_MONTHLY_PLAN.price} per ${CLOUD_MONTHLY_PLAN.interval} after a 7-day free trial (no card to start), and API access to run a fleet of sandboxes.`}
  />
</svelte:head>

<section class="mx-auto w-full max-w-4xl px-5 pt-16 pb-12 text-center">
  <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Simple pricing</h1>
  <p class="mx-auto mt-3 max-w-md text-muted">
    Start with a 7-day free trial, no card. Keep the free tier forever when you bring your own
    compute.
  </p>
</section>

<section class="mx-auto grid w-full max-w-5xl gap-5 px-5 pb-20 md:grid-cols-3">
  <!-- Free -->
  <div class="flex flex-col rounded-3xl border border-line bg-elevated p-6">
    {#if showFreeQr}
      <div class="flex grow flex-col items-center justify-center text-center">
        <a
          href="https://play.google.com/store/apps/details?id=com.supaclank.clank"
          rel="noreferrer"
          class="block h-40 w-40 overflow-hidden rounded-xl border border-line"
        >
          <QrPlay />
        </a>
        <p class="mt-4 text-sm text-muted">Scan with your phone's camera, or tap below.</p>
        <div class="mt-3">
          <PlayBadge size="sm" />
        </div>
        <button
          onclick={() => (showFreeQr = false)}
          class="mt-3 text-xs text-dim underline decoration-line underline-offset-2 transition-colors hover:text-muted"
        >
          Back to plan details
        </button>
      </div>
    {:else}
      <h2 class="text-lg font-semibold">Clank</h2>
      <p class="mt-1 min-h-10 text-sm text-muted">Local AI dev tool. Interactive native previews for web & mobile.</p>
      <div class="mt-5 flex items-baseline gap-1">
        <span class="text-3xl font-semibold tracking-tight">Free</span>
      </div>
      <ul class="mt-6 space-y-2.5 text-sm">
        {#each ['No account needed', 'Connect your phone to your laptop', 'Use your favorite agent harness', 'Share previews via tunnels'] as item}
          <li class="flex items-start gap-2.5">
            <span class="mt-0.5 text-brand">✓</span>
            <span class="text-muted">{item}</span>
          </li>
        {/each}
      </ul>
      <button
        type="button"
        onclick={copyFreeCmds}
        aria-label="Copy install and preview commands to clipboard"
        class="group relative mt-4 flex w-full items-start gap-2 rounded-xl bg-surface py-3 pr-2 pl-4 text-left font-mono text-xs leading-relaxed text-muted transition-colors hover:bg-line/60"
      >
        <div class="flex-1 overflow-x-auto">
          {#each FREE_CMDS as cmd}
            <div class="whitespace-nowrap"><span class="text-dim">$</span> {cmd}</div>
          {/each}
        </div>
        {#if freeCmdsCopied}
          <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        {:else}
          <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim group-hover:text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        {/if}
      </button>
      <div class="mt-auto pt-7">
        <button
          onclick={() => revealInstallQr('free')}
          class="block w-full rounded-xl border border-line px-5 py-3 text-center font-medium transition-colors hover:bg-surface"
        >
          Download app
        </button>
      </div>
    {/if}
  </div>

  <!-- Cloud -->
  <div class="relative flex flex-col rounded-3xl border-2 border-brand bg-elevated p-6 shadow-sm">
    {#if showQr}
      <div class="flex grow flex-col items-center justify-center text-center">
        <a
          href="https://play.google.com/store/apps/details?id=com.supaclank.clank"
          rel="noreferrer"
          class="block h-40 w-40 overflow-hidden rounded-xl border border-line"
        >
          <QrPlay />
        </a>
        <p class="mt-4 text-sm text-muted">Scan with your phone's camera, or tap below.</p>
        <div class="mt-3">
          <PlayBadge size="sm" />
        </div>
        <button
          onclick={() => (showQr = false)}
          class="mt-3 text-xs text-dim underline decoration-line underline-offset-2 transition-colors hover:text-muted"
        >
          Back to plan details
        </button>
      </div>
    {:else}
      <h2 class="text-lg font-semibold">Supaclank</h2>
      <p class="mt-1 min-h-10 text-sm text-muted">Close your laptop. Use your phone. Your cloud dev environment.</p>
      <div class="mt-5 flex items-baseline gap-1">
        <span class="text-3xl font-semibold tracking-tight">{CLOUD_MONTHLY_PLAN.price}</span>
        <span class="text-muted">/ {CLOUD_MONTHLY_PLAN.interval}</span>
      </div>
      <ul class="mt-6 space-y-2.5 text-sm">
        {#each ['7-day free trial', 'Code from anywhere, no laptop', 'Create & manage pull requests', 'Share private cloud previews'] as item}
          <li class="flex items-start gap-2.5">
            <span class="mt-0.5 text-brand">✓</span>
            <span class="text-muted">{item}</span>
          </li>
        {/each}
        <li class="flex items-start gap-2.5">
          <span class="mt-0.5 text-dim">✓</span>
          <span class="text-dim">
            GitHub bot
            <span class="ml-1 rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-dim uppercase">Soon</span>
          </span>
        </li>
      </ul>
      <div class="mt-auto pt-7">
        <a
          href="/signup"
          class="block rounded-xl bg-brand px-5 py-3 text-center font-medium text-white transition-colors hover:bg-brand-muted"
          >Get started</a
        >
      </div>
      <p class="mt-3 text-center text-xs text-dim">
        No card required to start.
        <button
          onclick={() => revealInstallQr('cloud')}
          class="underline decoration-line underline-offset-2 transition-colors hover:text-muted"
          >Or get the app</button
        >
      </p>
    {/if}
  </div>

  <!-- Fleet -->
  <div class="flex flex-col rounded-3xl border-2 border-dashed border-ink bg-elevated p-6">
    <h2 class="text-lg font-semibold">Clank Fleet</h2>
    <p class="mt-1 min-h-10 text-sm text-muted">Dev tool for collaboration and automations.</p>
    <div class="mt-5 flex items-baseline gap-1">
      <span class="text-3xl font-semibold tracking-tight">Coming soon</span>
    </div>
    <ul class="mt-6 space-y-2.5 text-sm">
      {#each ['Collaborative previews', 'Scheduled runs & custom triggers', 'Spin up agents via SDK', 'GitHub & Slack bot', 'Secrets management'] as item}
        <li class="flex items-start gap-2.5">
          <span class="mt-0.5 text-dim">✓</span>
          <span class="text-dim">{item}</span>
        </li>
      {/each}
    </ul>
    {#if waitlistJoined}
      <p class="mt-auto flex items-center justify-center gap-2 pt-7 pb-3 text-sm font-medium text-brand-muted">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        You're on the list. We'll be in touch.
      </p>
    {:else}
      <form onsubmit={joinWaitlist} class="mt-auto flex flex-col gap-2 pt-7">
        <input
          bind:value={waitlistEmail}
          type="email"
          required
          maxlength="320"
          placeholder="you@example.com"
          aria-label="Your work email"
          class="rounded-xl border border-line bg-surface px-4 py-3 text-sm transition-colors outline-none placeholder:text-dim focus:border-brand"
        />
        <button
          type="submit"
          disabled={waitlistSending}
          class={[
            'cursor-pointer rounded-xl border px-5 py-3 text-center font-medium transition-colors disabled:cursor-default disabled:opacity-60',
            waitlistTyped
              ? 'border-brand bg-brand text-white hover:bg-brand-muted'
              : 'border-line hover:bg-surface'
          ]}
        >
          {waitlistSending ? 'Joining…' : 'Join the waitlist'}
        </button>
        {#if waitlistError}
          <p class="text-center text-xs text-dim">Something went wrong, please try again.</p>
        {/if}
      </form>
    {/if}
  </div>
</section>
