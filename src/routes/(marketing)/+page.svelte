<script>
  import { onDestroy } from 'svelte';
  import PhoneShowcase from '$lib/PhoneShowcase.svelte';
  import LaptopShowcase from '$lib/LaptopShowcase.svelte';
  import GetApp from '$lib/GetApp.svelte';
  import QrPlay from '$lib/QrPlay.svelte';
  import { analyticsEvents, trackEvent } from '$lib/analytics.js';
  import { CLOUD_MONTHLY_PLAN } from '$lib/pricing.js';

  // "Start fresh or bring your own" tile — a working Describe / Import repo toggle.
  let buildMode = $state('describe');

  // Frontend banner terminal block — one button copies both commands
  // (no leading $, newline-joined) so they paste straight into a shell.
  const BANNER_CMDS = ['brew install supaclank/tap/clank', 'clank preview'];
  let bannerCmdsCopied = $state(false);
  let bannerCmdsCopiedTimeout;
  onDestroy(() => clearTimeout(bannerCmdsCopiedTimeout));
  async function copyBannerCmds() {
    try {
      await navigator.clipboard.writeText(BANNER_CMDS.join('\n'));
    } catch {
      return;
    }
    trackEvent(analyticsEvents.installCommandsCopied, { placement: 'homepage' });
    bannerCmdsCopied = true;
    clearTimeout(bannerCmdsCopiedTimeout);
    bannerCmdsCopiedTimeout = setTimeout(() => (bannerCmdsCopied = false), 1500);
  }
  // GitHub glyph, reused on the Import tab + the connect row.
  const gh =
    'M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z';
  // First-impression feedback is appended to the public Apps Script sheet endpoint.
  const FEEDBACK_URL =
    'https://script.google.com/macros/s/AKfycbyl6w8j6GW2syXMFvhw7I-9wNrw2Gu0caonu6bifmyq1ARXaXzQQCmYRBOVe3qJ0Ar_2A/exec';
  let feedback = $state('');
  let feedbackSending = $state(false);
  let feedbackSent = $state(false);
  let feedbackError = $state(false);

  async function sendFeedback(e) {
    e.preventDefault();
    const text = feedback.trim();
    if (!text || feedbackSending) return;
    feedbackSending = true;
    feedbackError = false;
    try {
      await fetch(FEEDBACK_URL, {
        method: 'POST',
        mode: 'no-cors',
        redirect: 'follow',
        // no-cors only allows CORS-safelisted headers, so an explicit
        // Content-Type: application/json is dropped/rewritten anyway.
        // [impression, ISO timestamp] — array so Apps Script can appendRow().
        body: JSON.stringify([text, new Date().toISOString()])
      });
      trackEvent(analyticsEvents.feedbackSubmitted, { placement: 'homepage' });
      feedbackSent = true;
    } catch (_) {
      feedbackError = true;
    } finally {
      feedbackSending = false;
    }
  }
</script>

<svelte:head>
  <title>Supaclank: build mobile apps from your phone</title>
  <meta
    name="description"
    content="Build mobile apps entirely from your phone. Start from scratch or connect an existing repo, build it by chatting, and watch every change render live on your device. Open source, self-hostable, free."
  />
</svelte:head>


<!-- Hero -->
<section class="mx-auto w-full max-w-5xl px-5 pt-16 pb-12 sm:pt-24">
  <div class="grid items-center gap-12 sm:grid-cols-[1.05fr_0.95fr]">
    <div>
      <p class="font-mono text-xs tracking-wide text-brand-muted uppercase">
        open-source · self-hostable · free
      </p>
      <h1 class="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
        Build mobile apps,<br />all from your phone.
      </h1>
      <p class="mt-5 max-w-md text-lg text-muted text-pretty">
        Edit your existing Expo app or start fresh. No more
        copy-pasting screenshots and error logs. Every change shows up
        <span class="font-medium text-ink">live, right on your phone</span>.
      </p>
      <div class="mt-8">
        <GetApp qr />
      </div>
      <p class="mt-4 text-sm text-dim">
        Free, open-source &amp; self-hostable.
        <a
          href="https://github.com/Acksell/clank"
          rel="noreferrer"
          class="font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
          >View on GitHub</a
        >
      </p>
    </div>

    <PhoneShowcase />
  </div>
</section>


<!-- Voice: the showcase is voice-first, so spell out the on-device model. -->
<section class="mx-auto w-full max-w-5xl px-5 py-4">
  <div
    class="flex flex-col items-center gap-5 rounded-2xl border border-line-subtle bg-surface p-6 text-center sm:flex-row sm:gap-7 sm:p-7 sm:text-left"
  >
    <!-- Mic + a little waveform, the same motif as the live showcase -->
    <div class="flex shrink-0 items-center gap-3 rounded-xl bg-elevated px-4 py-3.5">
      <svg
        class="h-5 w-5 text-brand"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
      </svg>
      <div class="flex items-center gap-[3px]" aria-hidden="true">
        {#each [7, 15, 10, 22, 13, 26, 9, 18, 24, 12, 20, 8, 14, 6] as h}
          <span class="w-[3px] rounded-full bg-brand" style="height: {h}px"></span>
        {/each}
      </div>
    </div>
    <div>
      <div class="flex items-center justify-center gap-2 sm:justify-start">
        <h2 class="text-lg font-semibold tracking-tight">On-device model.</h2>
        <span
          class="rounded-full border border-brand/30 bg-brand-dim px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-muted uppercase"
          >100% local</span
        >
      </div>
      <p class="mt-1.5 max-w-xl text-sm text-muted">
        Clank ships with a state-of-the-art voice model that runs
        <span class="font-medium text-ink">entirely on your phone</span>. No cloud, no API keys, no
        round-trip latency. Private, offline, and free.
      </p>
    </div>
  </div>
</section>


<!-- Bring your own AI — moved up to pair with the voice band so the two
     AI differentiators (on-device voice + your own model) read as a set. -->
<section class="mx-auto w-full max-w-5xl px-5 py-4">
  <div
    class="flex flex-col items-center gap-5 rounded-2xl border border-line-subtle bg-surface p-6 text-center sm:flex-row sm:gap-7 sm:p-7 sm:text-left"
  >
    <!-- "Your AI + clank" — your subscription, supercharged -->
    <div class="flex shrink-0 items-center gap-2.5 rounded-xl bg-elevated px-4 py-3.5">
      <span
        class="rounded-lg border border-line-subtle bg-paper px-2.5 py-2 text-xs font-medium text-muted"
        >Your AI</span
      >
      <span class="text-sm font-semibold text-dim">+</span>
      <span class="relative">
        <img src="/mascot.png" alt="" class="h-9 w-9 rounded-lg" />
        <svg
          class="absolute -top-1.5 -right-1.5 h-4 w-4 text-brand"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" />
        </svg>
      </span>
    </div>
    <div>
      <div class="flex items-center justify-center gap-2 sm:justify-start">
        <h2 class="text-lg font-semibold tracking-tight">Bring your own AI.</h2>
        <span
          class="rounded-full border border-brand/30 bg-brand-dim px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-muted uppercase"
          >no lock-in</span
        >
      </div>
      <p class="mt-1.5 max-w-xl text-sm text-muted">
        Connect your existing <span class="font-medium text-ink">Claude</span> or
        <span class="font-medium text-ink">ChatGPT</span> subscription, access 75+ LLM providers
        with <span class="font-medium text-ink">OpenCode</span>, or connect any other ACP-compatible
        harness like <span class="font-medium text-ink">Hermes</span>.
      </p>
    </div>
  </div>
</section>


<!-- Bring your own code — the third "no lock-in" band, pairing with the AI
     one above: this is a general dev tool over your repo, not a walled
     platform. Reuses the `gh` glyph already defined for the Import tab.
     Extra pb so the band clears the pink CTA that follows, matching the
     inter-card gap above. -->
<section class="mx-auto w-full max-w-5xl px-5 py-4 pb-8">
  <div
    class="flex flex-col items-center gap-5 rounded-2xl border border-line-subtle bg-surface p-6 text-center sm:flex-row sm:gap-7 sm:p-7 sm:text-left"
  >
    <!-- "Your repo + clank" — same paired-chip motif as the AI band -->
    <div class="flex shrink-0 items-center gap-2.5 rounded-xl bg-elevated px-4 py-3.5">
      <span
        class="rounded-lg border border-line-subtle bg-paper px-2.5 py-2 text-xs font-medium text-muted"
        >Your code</span
      >
      <span class="text-sm font-semibold text-dim">+</span>
      <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={gh} /></svg>
      </span>
    </div>
    <div>
      <div class="flex items-center justify-center gap-2 sm:justify-start">
        <h2 class="text-lg font-semibold tracking-tight">Bring your own code.</h2>
        <span
          class="rounded-full border border-brand/30 bg-brand-dim px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-muted uppercase"
          >no lock-in</span
        >
      </div>
      <p class="mt-1.5 max-w-xl text-sm text-muted">
        Run <code class="rounded bg-surface px-1.5 py-0.5 font-mono text-ink">clank preview</code>
        locally, or just import your repositories to our cloud sandbox and code without a laptop.
        Manage pull requests and ship features from anywhere.
      </p>
    </div>
  </div>
</section>


<!-- Frontend support banner — full-bleed (breaks out of the max-w-5xl
     rhythm every other section follows) so it reads as a distinct,
     unmissable callout rather than another feature card. -->
<section class="w-full bg-brand py-14 text-white selection:bg-white selection:text-ink">
  <div class="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 sm:grid-cols-2">
    <button
      type="button"
      onclick={copyBannerCmds}
      aria-label="Copy install and preview commands to clipboard"
      class="group relative mx-auto flex w-full max-w-sm items-start gap-3 rounded-sm border-2 border-dashed border-white/40 bg-black/20 p-4 text-left font-mono text-sm text-white transition-colors hover:border-white/70 hover:bg-black/30"
    >
      <span class="absolute -top-1 -left-1 h-2 w-2 rounded-[1px] bg-white"></span>
      <span class="absolute -top-1 -right-1 h-2 w-2 rounded-[1px] bg-white"></span>
      <span class="absolute -bottom-1 -left-1 h-2 w-2 rounded-[1px] bg-white"></span>
      <span class="absolute -right-1 -bottom-1 h-2 w-2 rounded-[1px] bg-white"></span>
      <div class="flex-1">
        {#each BANNER_CMDS as cmd}
          <div><span class="text-white/50">$</span> {cmd}</div>
        {/each}
      </div>
      {#if bannerCmdsCopied}
        <svg class="mt-0.5 h-4 w-4 shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
      {:else}
        <svg class="mt-0.5 h-4 w-4 shrink-0 text-white/50 group-hover:text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      {/if}
    </button>
    <div>
      <h2 class="text-2xl font-semibold tracking-tight text-balance">Psst… it works for frontends too.</h2>
      <p class="mt-2.5 max-w-md text-white/85">
        Clank isn't just for mobile. Get the same live preview and one-tap fixes in your browser for
        <span class="rounded bg-black/20 px-1.5 py-0.5 font-medium text-white">Svelte</span>, <span class="rounded bg-black/20 px-1.5 py-0.5 font-medium text-white">React</span>,
        <span class="rounded bg-black/20 px-1.5 py-0.5 font-medium text-white">Next.js</span>, <span class="rounded bg-black/20 px-1.5 py-0.5 font-medium text-white">Vue</span>,
        <span class="rounded bg-black/20 px-1.5 py-0.5 font-medium text-white">Preact</span>, or any app that runs <code class="rounded bg-black/20 px-1 py-0.5 text-[13px] text-white">vite</code>.
      </p>
    </div>
  </div>
</section>


<!-- Laptop showcase — web apps, built in the browser. The window column is
     a fixed 560px from lg up (the design width of the browser mock); below
     that it takes the fr share so narrow screens never overflow. -->
<section class="mx-auto w-full max-w-5xl px-5 py-12">
  <div class="grid items-center gap-12 sm:grid-cols-[1.05fr_0.95fr] lg:grid-cols-[minmax(0,1fr)_560px]">
    <div>
      <p class="font-mono text-xs tracking-wide text-brand-muted uppercase">
        now for the web
      </p>
      <h2 class="mt-4 text-3xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-4xl">
        Iterate on web apps,<br />in your own browser.
      </h2>
      <p class="mt-5 max-w-md text-lg text-muted text-pretty">
        <code class="rounded bg-surface px-1.5 py-0.5 text-base text-ink">clank preview</code>
        starts your app, opens the browser, injects the overlay, and connects to your agent of
        choice.
      </p>
      <div class="mt-7">
        <a
          href="/demo"
          class="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-muted"
        >
          Try now
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </div>
    </div>
    <div class="flex justify-center">
      <LaptopShowcase />
    </div>
  </div>
</section>


<!-- How it works — Local vs Cloud, same experience either way. -->
<section class="mx-auto w-full max-w-5xl px-5 py-12">
  <h2 class="text-2xl font-semibold tracking-tight">How it works</h2>
  <div class="mt-6 grid gap-8 sm:grid-cols-2">
    <div class="border-l-2 border-dashed border-brand pl-5">
      <h3 class="font-mono text-xs tracking-wide text-brand-muted uppercase">Local</h3>
      <p class="mt-2 text-sm text-muted">
        Run <code class="rounded bg-surface px-1 py-0.5 text-[13px] text-ink">clank preview</code>, a drop-in
        replacement for your Expo, Vite, or Next.js dev server. It starts your app, runs <code class="rounded bg-surface px-1 py-0.5 text-[13px] text-ink">clankd</code> alongside
        it, and connects your agent so edits hot-reload live as you go.
      </p>
    </div>
    <div class="border-l-2 border-dashed border-brand pl-5">
      <h3 class="font-mono text-xs tracking-wide text-brand-muted uppercase">Cloud</h3>
      <p class="mt-2 text-sm text-muted">
        Same experience, hosted. You don't have to run <code class="rounded bg-surface px-1 py-0.5 text-[13px] text-ink">clank preview</code> yourself,
        we run it for you. Build from your phone, or install our GitHub Bot for preview links on any pull request.
        <a href="/pricing" class="font-medium text-ink underline decoration-line underline-offset-2">
          {CLOUD_MONTHLY_PLAN.price}/{CLOUD_MONTHLY_PLAN.interval} after a 7-day free trial.
        </a>
      </p>
    </div>
  </div>
</section>


<!-- Feature highlights — a centered 2×2 bento. Each tile is a white card
     holding a small asset-light product mock (ink + coral only — no images,
     no stock gradients) on an inset surface, with the label beneath it. -->
<section class="mx-auto w-full max-w-5xl px-5 py-12">
  <div class="mx-auto mb-8 max-w-3xl text-center">
    <p class="font-mono text-xs tracking-wide text-brand-muted uppercase">the mobile app</p>
    <h2 class="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Everything you need to build and ship</h2>
    <p class="mx-auto mt-2 max-w-md text-muted text-pretty">
      Start or import a repo, point at anything, fix errors in context, and watch every change go live.
    </p>
  </div>

  <div class="bento mx-auto grid max-w-3xl grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 sm:gap-y-5">
    <!-- 1 · Start fresh or bring your own — Describe / Import repo toggle -->
    <div>
      <div class="flex h-44 flex-col justify-center rounded-xl border border-line-subtle bg-surface p-3">
        <div class="flex gap-1 rounded-lg bg-paper p-0.5 text-[11px] font-medium" role="group" aria-label="Build mode">
          <button
            type="button"
            onclick={() => (buildMode = 'describe')}
            aria-pressed={buildMode === 'describe'}
            class="flex-1 rounded-md px-2 py-1.5 text-center transition-colors {buildMode === 'describe'
              ? 'bg-brand text-white'
              : 'text-muted hover:text-ink'}">Describe</button
          >
          <button
            type="button"
            onclick={() => (buildMode = 'import')}
            aria-pressed={buildMode === 'import'}
            class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 transition-colors {buildMode ===
            'import'
              ? 'bg-brand text-white'
              : 'text-muted hover:text-ink'}"
          >
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={gh} /></svg>
            Import repo
          </button>
        </div>

        {#if buildMode === 'describe'}
          <div class="mt-2.5 flex items-center rounded-lg border border-line-subtle bg-elevated px-2.5 py-2 text-[11px] text-muted">
            A beautiful app for lawyers, no mistakes<span class="ml-px inline-block h-3 w-px translate-y-px animate-pulse bg-brand"></span>
          </div>
          <p class="mt-2 text-[10px] text-dim">Just say what you want, it starts building.</p>
        {:else}
          <div class="mt-2.5 flex items-center gap-2 rounded-lg border border-line-subtle bg-elevated px-2.5 py-2">
            <svg class="h-3.5 w-3.5 shrink-0 text-ink" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={gh} /></svg>
            <span class="text-[11px] text-ink">github.com/you/app</span>
            <span class="ml-auto rounded-md bg-brand px-2 py-0.5 text-[10px] font-medium text-white">Connect</span>
          </div>
          <p class="mt-2 text-[10px] text-dim">Bring a repo you already have and keep building.</p>
        {/if}
      </div>
      <h3 class="mt-4 text-base font-semibold">Start fresh or bring your own</h3>
      <p class="mt-1.5 text-sm text-muted">
        Spin up a brand-new app, or connect a GitHub repo you already have.
      </p>
    </div>

    <!-- 2 · Catch errors, fix in one tap -->
    <div>
      <div class="flex h-44 items-center rounded-xl border border-line-subtle bg-surface p-3" aria-hidden="true">
        <div class="w-full rounded-lg border border-line-subtle bg-elevated p-3 shadow-sm">
          <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-brand"></span>
            <span class="text-[11px] font-semibold text-ink">Error detected</span>
            <span class="ml-auto text-[10px] text-dim">Done</span>
          </div>
          <div class="mt-2 rounded-md border border-danger/20 bg-danger/10 px-2 py-1.5 font-mono text-[9px] leading-tight text-danger">
            TypeError: undefined is not a function
          </div>
          <div class="mt-2.5 flex gap-2">
            <span class="flex flex-1 items-center justify-center gap-1 rounded-md border border-line-subtle py-1.5 text-[10px] font-medium text-muted">
              <svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              Copy
            </span>
            <span class="flex-[1.3] rounded-md bg-ink py-1.5 text-center text-[10px] font-medium text-white">Fix it</span>
          </div>
        </div>
      </div>
      <h3 class="mt-4 text-base font-semibold">Catch errors, fix in one tap</h3>
      <p class="mt-1.5 text-sm text-muted">
        The agent sees the crash live, in context. Tap once and it fixes it.
      </p>
    </div>

    <!-- 3 · Point at anything — crop to show the agent -->
    <div>
      <div class="relative h-44 overflow-hidden rounded-xl border border-line-subtle bg-surface p-3" aria-hidden="true">
        <div class="flex h-full flex-col gap-2.5">
          <div class="h-2 w-2/5 rounded bg-[#d6d3cb]"></div>
          <div class="h-1.5 w-3/4 rounded bg-[#e1ded6]"></div>
          <div class="h-8 rounded-md border border-brand/25 bg-brand-dim"></div>
          <div class="h-1.5 w-1/2 rounded bg-[#e1ded6]"></div>
          <div class="h-1.5 w-2/3 rounded bg-[#e1ded6]"></div>
        </div>
        <div class="absolute top-10 right-8 bottom-9 left-9 rounded-sm border-2 border-dashed border-brand bg-brand/5">
          <span class="absolute -top-1 -left-1 h-2 w-2 rounded-[1px] bg-brand"></span>
          <span class="absolute -top-1 -right-1 h-2 w-2 rounded-[1px] bg-brand"></span>
          <span class="absolute -bottom-1 -left-1 h-2 w-2 rounded-[1px] bg-brand"></span>
          <span class="absolute -right-1 -bottom-1 h-2 w-2 rounded-[1px] bg-brand"></span>
        </div>
        <span class="absolute right-3 bottom-3 rounded-full bg-brand px-2.5 py-1 text-[9px] font-medium text-white">Add to context</span>
      </div>
      <h3 class="mt-4 text-base font-semibold">Point at anything</h3>
      <p class="mt-1.5 text-sm text-muted">
        Crop any part of the screen to show the agent exactly what you mean.
      </p>
    </div>

    <!-- 4 · Live on your phone -->
    <div>
      <div class="flex h-44 items-center justify-center rounded-xl border border-line-subtle bg-surface p-3" aria-hidden="true">
        <div class="w-[94px] overflow-hidden rounded-[15px] border-[3px] border-ink bg-white shadow-md">
          <div class="flex items-center justify-center gap-1 bg-brand py-[3px] text-[7px] font-semibold text-white">
            <svg class="h-2 w-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></svg>
            Refreshing…
          </div>
          <div class="space-y-1.5 p-2.5">
            <div class="h-1.5 w-3/5 rounded-full bg-zinc-200"></div>
            <div class="h-9 rounded-md border border-brand/20 bg-brand-dim"></div>
            <div class="h-1.5 w-full rounded-full bg-zinc-200"></div>
            <div class="h-1.5 w-2/5 rounded-full bg-zinc-200"></div>
          </div>
        </div>
      </div>
      <h3 class="mt-4 text-base font-semibold">Live on your phone</h3>
      <p class="mt-1.5 text-sm text-muted">
        Every change hot-reloads on your device as it’s built. Tweak it, retry, ship it.
      </p>
    </div>
  </div>

  <!-- Ship: get it out — open a PR, share a read-only preview -->
  <div class="mx-auto mt-12 mb-5 flex max-w-3xl items-center gap-3">
    <span class="font-mono text-xs font-medium tracking-wider text-dim uppercase">Ship</span>
    <span class="h-px flex-1 bg-line-subtle"></span>
  </div>
  <div class="bento mx-auto grid max-w-3xl grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 sm:gap-y-5">
    <!-- 5 · Smooth pull requests — a compact mirror of clank-mobile's
         CreatePRSheet form (header + branch · title · base · draft · Open PR). -->
    <div>
      <div class="flex h-44 items-center rounded-xl border border-line-subtle bg-surface p-3" aria-hidden="true">
        <div class="w-full rounded-lg border border-line-subtle bg-elevated p-3 shadow-sm">
          <div class="flex items-center gap-1.5">
            <svg class="h-3.5 w-3.5 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>
            <span class="text-[11px] font-semibold text-ink">Open pull request</span>
            <span class="ml-auto font-mono text-[9px] text-dim">add-reminders</span>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[9px] text-dim">
              <span>Base</span>
              <span class="rounded bg-surface px-1.5 py-0.5 font-mono text-ink">main</span>
            </div>
            <div class="flex items-center gap-1.5 text-[9px] text-dim">
              <span>Draft</span>
              <span class="relative h-4 w-[26px] shrink-0 rounded-full bg-[#d8d5cd]">
                <span class="absolute top-[2px] left-[2px] h-3 w-3 rounded-full bg-white shadow-sm"></span>
              </span>
            </div>
          </div>
          <div class="mt-3 flex gap-2">
            <span class="flex-1 rounded-md border border-line-subtle py-1.5 text-center text-[10px] font-medium text-muted">Push to remote</span>
            <span class="flex-[1.3] rounded-md bg-brand py-1.5 text-center text-[10px] font-medium text-white">Open PR</span>
          </div>
        </div>
      </div>
      <h3 class="mt-4 text-base font-semibold">Smooth pull requests</h3>
      <p class="mt-1.5 text-sm text-muted">
        Create a PR or contribute to an open one, straight from your phone.
      </p>
    </div>

    <!-- 6 · Share a read-only preview — real scannable QR (QrPlay) -->
    <div>
      <div class="flex h-44 items-center justify-center gap-3.5 rounded-xl border border-line-subtle bg-surface p-3" aria-hidden="true">
        <div class="rounded-lg border border-line-subtle bg-white p-1.5 shadow-sm">
          <div class="h-14 w-14"><QrPlay /></div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2.5 rounded-lg border border-line-subtle bg-elevated px-2.5 py-2">
            <span class="text-[10px] font-medium text-ink">Public URL</span>
            <span class="relative ml-auto h-[18px] w-[30px] shrink-0 rounded-full bg-brand">
              <span class="absolute top-[2px] right-[2px] h-3.5 w-3.5 rounded-full bg-white shadow-sm"></span>
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="rounded border border-line-subtle px-1.5 py-0.5 text-[8px] font-medium text-dim">Read-only</span>
            <span class="rounded border border-line-subtle px-1.5 py-0.5 text-[8px] font-medium text-dim">Time-limited</span>
          </div>
        </div>
      </div>
      <h3 class="mt-4 text-base font-semibold">Share a live preview</h3>
      <p class="mt-1.5 text-sm text-muted">
        Flip on a public URL to share a read-only, time-limited preview, by link or QR.
      </p>
    </div>

    <!-- 7 · Fix merge conflicts & failing CI — same "fix in one tap" pattern as
         the error card above, applied to conflicts/CI instead of runtime errors. -->
    <div>
      <div class="flex h-44 items-center rounded-xl border border-line-subtle bg-surface p-3" aria-hidden="true">
        <div class="w-full rounded-lg border border-line-subtle bg-elevated p-3 shadow-sm">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] font-semibold text-ink">2 problems found</span>
            <span class="ml-auto text-[10px] text-dim">Done</span>
          </div>
          <div class="mt-2.5 space-y-1.5">
            <div class="flex items-center gap-1.5 rounded-md border border-danger/40 bg-elevated px-2 py-1.5">
              <svg class="h-3 w-3 shrink-0 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              <span class="text-[10px] font-medium text-ink">Merge conflict</span>
              <span class="ml-auto text-[9px] text-dim">3 files</span>
            </div>
            <div class="flex items-center gap-1.5 rounded-md border border-danger/40 bg-elevated px-2 py-1.5">
              <svg class="h-3 w-3 shrink-0 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              <span class="text-[10px] font-medium text-ink">CI checks failing</span>
              <span class="ml-auto text-[9px] text-dim">1/2</span>
            </div>
          </div>
          <div class="mt-2.5 flex gap-2">
            <span class="flex flex-1 items-center justify-center gap-1 rounded-md border border-line-subtle py-1.5 text-center text-[10px] font-medium text-muted">
              Open on GitHub
              <svg class="h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </span>
            <span class="flex flex-[1.3] items-center justify-center gap-1 rounded-md bg-brand py-1.5 text-center text-[10px] font-medium text-white">
              <svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" /></svg>
              Fix with agent
            </span>
          </div>
        </div>
      </div>
      <h3 class="mt-4 text-base font-semibold">Fix conflicts and failing CI</h3>
      <p class="mt-1.5 text-sm text-muted">
        Hit a merge conflict or a red check? One tap sends it to the agent to resolve.
      </p>
    </div>

    <!-- 8 · Manage your pull requests — mirrors clank-mobile's branch list,
         leading with the Drafts / Ready for review / Closed tab bar. -->
    <div>
      <div class="flex h-44 flex-col justify-center rounded-xl border border-line-subtle bg-surface p-3" aria-hidden="true">
        <div class="flex items-center gap-3 border-b border-line-subtle text-[10px] font-medium">
          <span class="border-b-2 border-brand pb-1.5 text-brand">Drafts</span>
          <span class="pb-1.5 text-dim">Ready for review</span>
          <span class="pb-1.5 text-dim">Closed</span>
        </div>
        <div class="mt-2.5 space-y-1.5">
          <div class="flex items-center justify-between rounded-lg border border-line-subtle bg-elevated px-2.5 py-2 shadow-sm">
            <div class="flex min-w-0 items-center gap-1.5">
              <svg class="h-3 w-3 shrink-0 text-dim" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 7.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0-4.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z" /></svg>
              <div class="min-w-0">
                <div class="truncate text-[10px] font-medium text-ink">feat(webpreview): Web Speech API dictation with first-use engine picker</div>
                <div class="mt-0.5 flex items-center gap-1 text-[9px] text-dim">
                  <span class="text-brand">Ready</span>
                  <span>·</span>
                  <span>#164</span>
                  <span>·</span>
                  <span class="flex items-center gap-0.5 text-warning">
                    <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-warning"></span>
                    1/2
                  </span>
                </div>
              </div>
            </div>
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand">
              <svg class="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </div>
          <div class="flex items-center justify-between rounded-lg border border-line-subtle bg-elevated px-2.5 py-2 shadow-sm">
            <div class="flex min-w-0 items-center gap-1.5">
              <svg class="h-3 w-3 shrink-0 text-dim" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 7.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0-4.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z" /></svg>
              <div class="min-w-0">
                <div class="truncate text-[10px] font-medium text-ink">feat(webpreview): grab screenshot/area from the web preview overlay</div>
                <div class="mt-0.5 flex items-center gap-1 text-[9px] text-dim">
                  <span class="text-danger">Conflicts</span>
                  <span>·</span>
                  <span>#160</span>
                  <span>·</span>
                  <span class="flex items-center gap-0.5 text-success">
                    <svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                    CI
                  </span>
                </div>
              </div>
            </div>
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand">
              <svg class="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </div>
        </div>
      </div>
      <h3 class="mt-4 text-base font-semibold">Manage your pull requests</h3>
      <p class="mt-1.5 text-sm text-muted">
        Browse drafts, ready-for-review, and closed branches, and jump back into any of them.
      </p>
    </div>
  </div>
</section>


<!-- Coming soon — roadmap peek. Dashed, lighter treatment so it reads as
     "not shipped yet" against the solid feature bento above. -->
<section class="mx-auto w-full max-w-5xl px-5 py-12">
  <div class="mx-auto max-w-3xl">
    <div class="mb-8 text-center">
      <p class="font-mono text-xs tracking-wide text-brand-muted uppercase">on the roadmap</p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight text-balance">Coming soon</h2>
    </div>
    <div class="grid gap-5 sm:grid-cols-2">
      <!-- Frame-drop detection & debugging -->
      <div class="rounded-2xl border border-dashed border-line p-5">
        <div class="flex items-center justify-between">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
          </span>
          <span class="rounded-full border border-brand/30 bg-brand-dim px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-muted uppercase">Soon</span>
        </div>
        <h3 class="mt-3.5 text-base font-semibold">Frame-drop detection &amp; debugging</h3>
        <p class="mt-1.5 text-sm text-muted">
          Catch jank as it happens and trace it back to the cause, profiled live on your device.
        </p>
      </div>
      <!-- Preview links on pull requests -->
      <div class="rounded-2xl border border-dashed border-line p-5">
        <div class="flex items-center justify-between">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand">
            <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={gh} /></svg>
          </span>
          <span class="rounded-full border border-brand/30 bg-brand-dim px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-muted uppercase">Soon</span>
        </div>
        <h3 class="mt-3.5 text-base font-semibold">Preview links on every pull request</h3>
        <p class="mt-1.5 text-sm text-muted">
          A GitHub bot that posts a live preview link on each PR, so reviewers can open the build in one tap.
        </p>
      </div>
      <!-- iOS support -->
      <div class="rounded-2xl border border-dashed border-line p-5">
        <div class="flex items-center justify-between">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
          </span>
          <span class="rounded-full border border-brand/30 bg-brand-dim px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-muted uppercase">Soon</span>
        </div>
        <h3 class="mt-3.5 text-base font-semibold">iOS</h3>
        <p class="mt-1.5 text-sm text-muted">
          The same instant previews and one-tap installs, on your iPhone.
        </p>
      </div>
      <!-- Feature request — the one card in this grid that's actionable
           right now, not a "Soon" placeholder. Solid border + hover state
           so it reads as a link out, not a roadmap teaser. -->
      <a
        href="https://github.com/Acksell/clank/issues/new?labels=enhancement&title=Feature+request%3A+"
        target="_blank"
        rel="noreferrer"
        class="group rounded-2xl border border-dashed border-brand p-5 transition-colors hover:border-brand-muted"
      >
        <div class="flex items-center justify-between">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
          </span>
          <span
            class="text-xs font-medium text-brand-muted underline decoration-line underline-offset-2 group-hover:decoration-brand"
            >Open an issue</span
          >
        </div>
        <h3 class="mt-3.5 text-base font-semibold">Have a feature request?</h3>
        <p class="mt-1.5 text-sm text-muted">Tell us what to build next, straight on GitHub.</p>
      </a>
    </div>
    <p class="mt-6 text-center text-sm text-dim">…and more on the way.</p>
  </div>
</section>


<!-- First impressions — fire-and-forget feedback to a Google Sheet via a
     no-cors Apps Script POST. -->
<section class="mx-auto w-full max-w-5xl px-5 py-4">
  <div class="mx-auto max-w-xl rounded-2xl bg-brand p-6 text-center text-white selection:bg-white selection:text-ink sm:p-7">
    <h2 class="text-lg font-semibold tracking-tight">First impressions?</h2>
    <p class="mt-1.5 text-sm text-white/85">Send them our way. We read everything!</p>
    {#if feedbackSent}
      <p class="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-white">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        Thank you for sharing!
      </p>
    {:else}
      <form onsubmit={sendFeedback} class="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          bind:value={feedback}
          type="text"
          maxlength="1000"
          placeholder="What do you think?"
          aria-label="Your first impressions"
          class="flex-1 rounded-lg border border-white/30 bg-black/20 px-3.5 py-2.5 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={feedbackSending || !feedback.trim()}
          class="rounded-lg bg-white px-5 py-2.5 text-sm font-medium whitespace-nowrap text-brand shadow-sm transition-colors hover:bg-white/90 disabled:opacity-60"
          >{feedbackSending ? 'Sending…' : 'Send'}</button
        >
      </form>
      {#if feedbackError}
        <p class="mt-2 text-xs text-white/90">Failed to send feedback. Please try again.</p>
      {/if}
    {/if}
  </div>
</section>


<!-- Final call to action -->
<section class="mx-auto w-full max-w-5xl px-5 py-16">
  <div class="flex flex-col items-center gap-5 rounded-3xl bg-ink px-6 py-12 text-center text-paper">
    <img src="/mascot.png" alt="" width="96" height="96" class="rounded-xl" />
    <h2 class="max-w-lg text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
      Use your creativity. Build it from your pocket.
    </h2>
    <p class="max-w-md text-paper/70">
      Open-source. Build on your phone. Self-host clank yourself, or let supaclank run the
      cloud.
    </p>
    <GetApp qr variant="ondark" />
  </div>
</section>

<style>
  /* Mobile: the feature cards stack one per row. Show the title above its
     illustration (more intuitive) by turning each card into a flex column
     and reordering — title, description, then the illustration drops to the
     bottom. Desktop (≥640px) keeps the natural illustration-then-title order. */
  @media (max-width: 639px) {
    .bento > div {
      display: flex;
      flex-direction: column;
    }
    .bento > div > div {
      order: 3;
      margin-top: 1rem;
    }
    .bento > div > h3 {
      order: 1;
      margin-top: 0;
    }
    .bento > div > p {
      order: 2;
    }
  }
</style>
