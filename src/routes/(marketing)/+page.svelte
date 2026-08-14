<script>
  // The Meadow landing page: a living pixel world (from the shared layout)
  // with the product story on top — hero + phone on its plinth, the three
  // design-decision bands, six product-mock feature cards, the pink frontend
  // band with the framework conveyor, stacked Local/Cloud, the roadmap as
  // agent sessions, and the final CTA before the page digs into the soil.
  import PhoneShowcase from '$lib/PhoneShowcase.svelte';
  import MeadowStage from '$lib/meadow/MeadowStage.svelte';
  import Terminal from '$lib/meadow/Terminal.svelte';
  import FrameworkBelt from '$lib/meadow/FrameworkBelt.svelte';
  import RoadmapSessions from '$lib/meadow/RoadmapSessions.svelte';
  import { CLOUD_MONTHLY_PLAN } from '$lib/pricing.js';

  const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.supaclank.clank';
  const GITHUB_URL = 'https://github.com/Acksell/clank';

  // "Start fresh or bring your own" tile — a working Describe / Import toggle.
  let buildMode = $state('describe');

  // GitHub glyph, reused across the page.
  const gh =
    'M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z';
</script>

<svelte:head>
  <title>Supaclank: build mobile apps from your phone</title>
  <meta
    name="description"
    content="Build mobile apps entirely from your phone. Start from scratch or connect an existing repo, build it by chatting, and watch every change render live on your device. Open source, self-hostable, free."
  />
</svelte:head>

<!-- ======= hero ======= -->
<header class="hero" id="top">
  <div class="hero-copy">
    <div class="eyebrow" aria-label="open-source, self-hostable, free">
      <span class="pill-life">open-source</span>
      <span class="pill-life">self-hostable</span>
      <span class="pill-life">free</span>
    </div>
    <h1>Build mobile apps,<br />all from <span class="pk">your&nbsp;phone.</span></h1>
    <p class="sub">
      Edit your existing Expo app or start fresh. No more copy-pasting screenshots and error logs.
      Every change shows up <b>live, right on your phone</b>.
    </p>
    <div class="ctarow">
      <a class="btn-raised btn-raised-primary" href={PLAY_URL} rel="noreferrer">
        <svg width="14" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M1.6.9c-.3.2-.5.5-.5.9v12.4c0 .4.2.7.5.9L8.3 8 1.6.9Zm8.6 5.2L3.5.6 12 5.5l-1.8.6ZM12 10.5 3.5 15.4l6.7-5.5 1.8.6Zm2.5-3.3-2.1-1.2-1.7 2 1.7 2 2.1-1.2c.8-.5.8-1.2 0-1.6Z" /></svg>
        Get the app
      </a>
      <a class="btn-raised btn-raised-ghost" href={GITHUB_URL} rel="noreferrer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={gh} /></svg>
        View on GitHub
      </a>
      <a class="textlink" href="/demo">try the web demo →</a>
    </div>

    <Terminal caret placement="homepage" />
  </div>

  <MeadowStage>
    <PhoneShowcase />
  </MeadowStage>
</header>

<!-- ======= 01 · design decisions ======= -->
<section class="sec decisions" id="decisions">
  <div class="seclabel"><span class="num">01</span> design decisions <span class="rule"></span></div>
  <div class="bands">
    <article class="band panel-raised">
      <div class="band-chip" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" /></svg>
        <span class="wavebars">
          {#each [7, 15, 10, 22, 13, 26, 9, 18, 24, 12, 20, 8, 14, 6] as h (h)}
            <i style="height: {h}px"></i>
          {/each}
        </span>
      </div>
      <div class="band-copy">
        <div class="band-title">
          <h3>On-device voice model.</h3>
          <span class="pill-life pill-life-up">100% local</span>
        </div>
        <p>
          Clank ships with a state-of-the-art voice model that runs <b>entirely on your phone</b>.
          No cloud, no API keys, no round-trip latency. Private, offline, and free.
        </p>
      </div>
    </article>

    <article class="band panel-raised">
      <div class="band-chip" aria-hidden="true">
        <span class="tagbox">Your AI</span>
        <span class="plus">+</span>
        <span class="sqico">
          <img src="/mascot.png" alt="" width="36" height="36" />
          <svg class="spark" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" /></svg>
        </span>
      </div>
      <div class="band-copy">
        <div class="band-title">
          <h3>Bring your own AI.</h3>
          <span class="pill-life pill-life-up">no lock-in</span>
        </div>
        <p>
          Connect your existing <b>Claude</b> or <b>ChatGPT</b> subscription, access 75+ LLM
          providers with <b>OpenCode</b>, or connect any other ACP-compatible harness.
        </p>
      </div>
    </article>

    <article class="band panel-raised">
      <div class="band-chip" aria-hidden="true">
        <span class="tagbox">Your code</span>
        <span class="plus">+</span>
        <span class="sqico inkbg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={gh} /></svg>
        </span>
      </div>
      <div class="band-copy">
        <div class="band-title">
          <h3>Bring your own code.</h3>
          <span class="pill-life pill-life-up">no lock-in</span>
        </div>
        <p>
          Run <code>clank preview</code> locally, or import your repositories to our cloud sandbox
          and code without a laptop.
        </p>
      </div>
    </article>
  </div>
</section>

<!-- ======= 02 · features ======= -->
<section class="sec" id="capabilities">
  <div class="sechead">
    <div class="seclabel"><span class="num">02</span> the mobile app</div>
    <h2>Everything you need to build and ship</h2>
    <p class="lead">
      Start or import a repo, point at anything, fix errors in context, and watch every change go
      live.
    </p>
  </div>

  <div class="fgrid">
    <!-- 1 · start fresh or bring your own -->
    <div class="fcard panel-raised">
      <div class="fmock">
        <div class="seg" role="group" aria-label="Build mode">
          <button type="button" onclick={() => (buildMode = 'describe')} aria-pressed={buildMode === 'describe'}>Describe</button>
          <button type="button" onclick={() => (buildMode = 'import')} aria-pressed={buildMode === 'import'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={gh} /></svg>
            Import repo
          </button>
        </div>
        {#if buildMode === 'describe'}
          <div class="mockinput">A beautiful app for lawyers, no mistakes<span class="mcaret"></span></div>
          <p class="mockhint">Just say what you want, it starts building.</p>
        {:else}
          <div class="mockinput">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="color:var(--color-ink);flex:none" aria-hidden="true"><path d={gh} /></svg>
            <span style="color:var(--color-ink)">github.com/you/app</span>
            <span class="connect">Connect</span>
          </div>
          <p class="mockhint">Bring a repo you already have and keep building.</p>
        {/if}
      </div>
      <h3>Start fresh or bring your own</h3>
      <p>Spin up a brand-new app, or connect a GitHub repo you already have.</p>
    </div>

    <!-- 2 · catch errors -->
    <div class="fcard panel-raised">
      <div class="fmock" aria-hidden="true">
        <div class="mockcard">
          <div class="mrow">
            <span class="pinkdot"></span>
            <span class="mtitle">Error detected</span>
            <span class="mmeta">Done</span>
          </div>
          <div class="errbox">TypeError: undefined is not a function</div>
          <div class="mbtnrow">
            <span class="mbtn">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              Copy
            </span>
            <span class="mbtn solid">Fix it</span>
          </div>
        </div>
      </div>
      <h3>Catch errors, fix in one tap</h3>
      <p>The agent sees the crash live, in context. Tap once and it fixes it.</p>
    </div>

    <!-- 3 · point at anything -->
    <div class="fcard panel-raised">
      <div class="fmock" aria-hidden="true">
        <div class="greek">
          <i class="g1"></i><i class="g2"></i><i class="g3"></i><i class="g4"></i><i class="g5"></i>
        </div>
        <div class="cropbox"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i></div>
        <span class="cropchip">Add to context</span>
      </div>
      <h3>Point at anything</h3>
      <p>Crop any part of the screen to show the agent exactly what you mean.</p>
    </div>

    <!-- 4 · live on your phone -->
    <div class="fcard panel-raised">
      <div class="fmock" aria-hidden="true">
        <div class="tinyphone">
          <div class="tp-reload">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></svg>
            Refreshing…
          </div>
          <div class="tp-body">
            <i class="l1"></i><span class="blk"></span><i class="l2"></i><i class="l3"></i>
          </div>
        </div>
      </div>
      <h3>Live on your phone</h3>
      <p>Every change hot-reloads on your device as it’s built. Tweak it, retry, ship it.</p>
    </div>

    <!-- 5 · smooth pull requests -->
    <div class="fcard panel-raised">
      <div class="fmock" aria-hidden="true">
        <div class="mockcard">
          <div class="mrow">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>
            <span class="mtitle">Open pull request</span>
            <span class="mmeta mono">add-reminders</span>
          </div>
          <div class="mrow spaced">
            <span class="mrow tight"><span class="mlabel">Base</span><span class="basechip">main</span></span>
            <span class="mrow tight"><span class="mlabel">Draft</span><span class="toggle"><i></i></span></span>
          </div>
          <div class="mbtnrow pushdown">
            <span class="mbtn">Push to remote</span>
            <span class="mbtn pinksolid">Open PR</span>
          </div>
        </div>
      </div>
      <h3>Smooth pull requests</h3>
      <p>Create a PR or contribute to an open one, straight from your phone.</p>
    </div>

    <!-- 6 · fix conflicts & CI -->
    <div class="fcard panel-raised">
      <div class="fmock" aria-hidden="true">
        <div class="mockcard">
          <div class="mrow">
            <span class="mtitle">2 problems found</span>
            <span class="mmeta">Done</span>
          </div>
          <div class="probrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <span class="pn">Merge conflict</span><span class="pm">3 files</span>
          </div>
          <div class="probrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            <span class="pn">CI checks failing</span><span class="pm">1/2</span>
          </div>
          <div class="mbtnrow">
            <span class="mbtn">Open on GitHub</span>
            <span class="mbtn pinksolid">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" /></svg>
              Fix with agent
            </span>
          </div>
        </div>
      </div>
      <h3>Fix conflicts and failing CI</h3>
      <p>Hit a merge conflict or a red check? One tap sends it to the agent to resolve.</p>
    </div>
  </div>
</section>

<!-- ======= 03 · frontend band (the pink moment) ======= -->
<div class="dither" style="--from:var(--color-paper);--to:#fa5573" aria-hidden="true"></div>
<section class="frontends">
  <div class="front-head">
    <h2>Psst… it works for frontends too.</h2>
    <p>
      Clank isn’t just for mobile. Get the same live preview and one-tap fixes in your browser for
      <span class="fchip">Svelte</span>, <span class="fchip">React</span>,
      <span class="fchip">Next.js</span>, <span class="fchip">Vue</span>,
      <span class="fchip">Preact</span>, or any app that runs <code>vite</code>.
    </p>
  </div>
  <FrameworkBelt />
</section>
<div class="dither" style="--from:#fa5573;--to:var(--color-paper)" aria-hidden="true"></div>

<!-- ======= 04 · how it works ======= -->
<section class="sec" id="how">
  <div class="seclabel"><span class="num">03</span> how it works <span class="rule"></span></div>
  <h2>How it works</h2>
  <div class="howstack">
    <article class="how panel-raised">
      <div class="how-side">
        <span class="mode">LOCAL</span>
        <span class="pill-life pill-life-up">free forever</span>
      </div>
      <div>
        <p>
          Run <code>clank preview</code>, a drop-in replacement for your Expo, Vite, or Next.js dev
          server. It starts your app, runs <code>clankd</code> alongside it, and connects your agent
          so edits hot-reload live as you go.
        </p>
        <div class="how-term"><Terminal placement="how-local" /></div>
      </div>
    </article>

    <article class="how panel-raised">
      <div class="how-side">
        <span class="mode">CLOUD</span>
      </div>
      <div>
        <p>
          Same experience, hosted. You don’t have to run <code>clank preview</code> yourself, we run
          it for you. Build from your phone, or install our GitHub Bot for preview links on any pull
          request.
        </p>
        <p class="pricerow">
          <a class="pricelink" href="/pricing"
            >{CLOUD_MONTHLY_PLAN.price}/{CLOUD_MONTHLY_PLAN.interval} after a 7-day free trial.</a
          >
        </p>
      </div>
    </article>
  </div>
</section>

<!-- ======= 05 · roadmap as agent sessions ======= -->
<section class="sec roadmap" id="roadmap">
  <div class="seclabel"><span class="num">04</span> on the roadmap <span class="rule"></span></div>
  <h2>On the roadmap</h2>
  <p class="lead roadlead">
    These are coming soon. Want something else? Post your anonymous feature requests below!
  </p>
  <RoadmapSessions />
</section>

<!-- ======= 06 · final CTA ======= -->
<section class="sec cta">
  <div class="seclabel center"><span class="yourmove"><b>05</b> — YOUR MOVE</span></div>
  <h2 class="ctahead">Use your creativity.<span class="pk">Build it from your pocket.</span></h2>
  <p class="lead ctalead">
    Open-source. Build on your phone. Self-host clank yourself, or let supaclank run the cloud.
  </p>
  <div class="ctarow center">
    <a class="btn-raised btn-raised-primary" href={PLAY_URL} rel="noreferrer">
      <svg width="14" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M1.6.9c-.3.2-.5.5-.5.9v12.4c0 .4.2.7.5.9L8.3 8 1.6.9Zm8.6 5.2L3.5.6 12 5.5l-1.8.6ZM12 10.5 3.5 15.4l6.7-5.5 1.8.6Zm2.5-3.3-2.1-1.2-1.7 2 1.7 2 2.1-1.2c.8-.5.8-1.2 0-1.6Z" /></svg>
      Get the app
    </a>
    <a class="btn-raised btn-raised-ghost" href={GITHUB_URL} rel="noreferrer">View on GitHub</a>
    <a class="textlink" href="/demo">try the web demo →</a>
  </div>
</section>

<style>
  /* ---------- shared section chrome ---------- */
  .sec {
    max-width: 1180px;
    margin: 0 auto;
    padding: 96px 32px;
  }
  h2 {
    font: 800 clamp(28px, 3.3vw, 40px) / 1.08 var(--font-sans);
    letter-spacing: -0.025em;
    margin-bottom: 14px;
  }
  .lead {
    font: 400 16.5px/1.6 var(--font-sans);
    color: var(--color-muted);
    max-width: 58ch;
  }
  .textlink {
    font: 500 13px var(--font-mono);
    color: var(--color-meadow-text);
    text-decoration: none;
    border-bottom: 1px solid var(--color-line-mid);
    padding-bottom: 2px;
  }
  .textlink:hover {
    color: var(--color-ink);
    border-bottom-color: var(--color-meadow-text);
  }
  .ctarow {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    margin-bottom: 36px;
  }
  .ctarow.center {
    justify-content: center;
    margin-bottom: 0;
  }

  /* ---------- hero ---------- */
  .hero {
    position: relative;
    max-width: 1180px;
    margin: 0 auto;
    padding: 80px 32px 24px;
    /* Height is measured under the sticky 60px header (in flow, unlike the
       mockup's fixed nav). 94vh matches the mockup — the phone sits close
       to the ground — minus one 14px front-terrain cell to lift the copy
       and phone a grass-row above it. */
    min-height: calc(94vh - 60px - 14px);
    display: grid;
    grid-template-columns: minmax(0, 1.04fr) minmax(0, 0.96fr);
    gap: 40px;
    align-items: end;
  }
  .hero-copy {
    padding-bottom: 56px;
  }
  .eyebrow {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 26px;
  }
  h1 {
    font: 800 clamp(35px, 4.3vw, 60px) / 1.04 var(--font-sans);
    letter-spacing: -0.035em;
    margin-bottom: 22px;
  }
  .pk {
    color: var(--color-brand);
  }
  .sub {
    font: 400 17px/1.62 var(--font-sans);
    color: var(--color-muted);
    max-width: 52ch;
    margin-bottom: 30px;
  }
  .sub b {
    color: var(--color-ink);
    font-weight: 600;
  }

  /* ---------- design decisions ---------- */
  .decisions {
    /* The hero fills 94vh (+ header + its 24px bottom pad); 6vh + 40px of
       breathing room keeps this section just under the fold on first render —
       you scroll to meet it. */
    padding-top: calc(6vh + 40px);
    padding-bottom: 64px;
  }
  .bands {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .band {
    display: flex;
    align-items: center;
    gap: 30px;
    padding: 26px 30px;
  }
  .band-chip {
    flex: none;
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--color-surface);
    border: 1px solid var(--color-line);
    padding: 14px 18px;
    border-radius: 2px;
  }
  .band-chip .tagbox {
    font: 500 12px var(--font-sans);
    color: var(--color-muted);
    background: var(--color-paper);
    border: 1px solid var(--color-line);
    padding: 9px 11px;
    border-radius: 2px;
    white-space: nowrap;
  }
  .band-chip .plus {
    font: 600 13px var(--font-sans);
    color: var(--color-dim);
  }
  .band-chip .sqico {
    position: relative;
    display: flex;
    height: 36px;
    width: 36px;
    flex: none;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  .band-chip .sqico.inkbg {
    background: var(--color-ink);
    color: #fff;
  }
  .band-chip img {
    height: 36px;
    width: 36px;
    border-radius: 4px;
    display: block;
  }
  .band-chip .spark {
    position: absolute;
    top: -7px;
    right: -7px;
    color: var(--color-brand);
  }
  .wavebars {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .wavebars i {
    width: 3px;
    border-radius: 999px;
    background: var(--color-brand);
    display: block;
  }
  .band-copy h3 {
    font: 700 19px var(--font-sans);
    letter-spacing: -0.015em;
    display: inline;
  }
  .band-title {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .band-copy p {
    font: 400 14px/1.6 var(--font-sans);
    color: var(--color-muted);
    margin-top: 7px;
    max-width: 64ch;
  }
  .band-copy p b {
    color: var(--color-ink);
    font-weight: 600;
  }
  .band-copy code {
    font: 500 12.5px var(--font-mono);
    color: var(--color-ink);
    background: var(--color-surface);
    border: 1px solid var(--color-line);
    padding: 1px 6px;
    border-radius: 2px;
  }

  /* ---------- features ---------- */
  .sechead {
    max-width: 700px;
    margin: 0 auto 44px;
    text-align: center;
  }
  .sechead h2 {
    text-wrap: balance;
  }
  .sechead .lead {
    margin: 0 auto;
    text-wrap: pretty;
  }
  .sechead .seclabel {
    justify-content: center;
  }
  .fgrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 22px;
    max-width: 1000px;
    margin: 0 auto;
  }
  .fcard {
    padding: 18px 18px 22px;
  }
  .fmock {
    position: relative;
    height: 196px;
    background: var(--color-surface);
    border: 1px solid var(--color-line);
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 16px;
    overflow: hidden;
  }
  .fcard h3 {
    font: 700 16.5px var(--font-sans);
    letter-spacing: -0.01em;
    margin-top: 16px;
  }
  .fcard > p {
    font: 400 13.5px/1.55 var(--font-sans);
    color: var(--color-muted);
    margin-top: 6px;
  }

  /* shared mock atoms */
  .mockcard {
    background: var(--color-elevated);
    border: 1px solid var(--color-line-subtle);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 1px 2px rgba(26, 23, 20, 0.05);
  }
  .mrow {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .mrow.spaced {
    margin-top: 12px;
    justify-content: space-between;
  }
  .mrow.tight {
    gap: 6px;
  }
  .mtitle {
    font: 700 11px var(--font-sans);
    color: var(--color-ink);
  }
  .mmeta {
    margin-left: auto;
    font: 400 10px var(--font-sans);
    color: var(--color-dim);
  }
  .mmeta.mono {
    font-family: var(--font-mono);
    font-size: 9px;
  }
  .mbtnrow {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .mbtnrow.pushdown {
    margin-top: 12px;
  }
  .mbtn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 1px solid var(--color-line-subtle);
    border-radius: 6px;
    padding: 6px 0;
    font: 500 10px var(--font-sans);
    color: var(--color-muted);
  }
  .mbtn.solid {
    flex: 1.3;
    background: var(--color-ink);
    color: #fff;
    border-color: var(--color-ink);
  }
  .mbtn.pinksolid {
    flex: 1.3;
    background: var(--color-brand);
    color: #fff;
    border-color: var(--color-brand);
  }

  /* 1 · describe / import toggle */
  .seg {
    display: flex;
    gap: 4px;
    background: var(--color-paper);
    border: 1px solid var(--color-line-subtle);
    border-radius: 8px;
    padding: 3px;
  }
  .seg button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: none;
    background: transparent;
    border-radius: 6px;
    padding: 7px 4px;
    font: 500 11px var(--font-sans);
    color: var(--color-muted);
    cursor: pointer;
  }
  .seg button:hover {
    color: var(--color-ink);
  }
  .seg button[aria-pressed='true'] {
    background: var(--color-brand);
    color: #fff;
  }
  .mockinput {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--color-elevated);
    border: 1px solid var(--color-line-subtle);
    border-radius: 8px;
    padding: 8px 10px;
    font: 400 11px var(--font-sans);
    color: var(--color-muted);
  }
  .mcaret {
    display: inline-block;
    width: 1px;
    height: 12px;
    background: var(--color-brand);
    animation: mblink 1.1s step-end infinite;
  }
  @keyframes mblink {
    50% {
      opacity: 0;
    }
  }
  .connect {
    margin-left: auto;
    background: var(--color-brand);
    color: #fff;
    border-radius: 6px;
    padding: 2px 8px;
    font: 500 10px var(--font-sans);
    white-space: nowrap;
  }
  .mockhint {
    margin-top: 8px;
    font: 400 10px var(--font-sans);
    color: var(--color-dim);
  }

  /* 2 · error card */
  .errbox {
    margin-top: 8px;
    background: rgba(214, 69, 69, 0.1);
    border: 1px solid rgba(214, 69, 69, 0.22);
    border-radius: 6px;
    padding: 6px 8px;
    font: 400 9px/1.4 var(--font-mono);
    color: var(--color-danger);
  }
  .pinkdot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--color-brand);
    flex: none;
  }

  /* 3 · crop overlay */
  .greek {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    justify-content: center;
  }
  .greek i {
    display: block;
    border-radius: 4px;
  }
  .greek .g1 {
    height: 8px;
    width: 40%;
    background: #d6d3cb;
  }
  .greek .g2 {
    height: 6px;
    width: 75%;
    background: #e1ded6;
  }
  .greek .g3 {
    height: 32px;
    width: 100%;
    background: var(--color-brand-dim);
    border: 1px solid rgba(250, 85, 115, 0.25);
  }
  .greek .g4 {
    height: 6px;
    width: 50%;
    background: #e1ded6;
  }
  .greek .g5 {
    height: 6px;
    width: 66%;
    background: #e1ded6;
  }
  .cropbox {
    position: absolute;
    top: 40px;
    right: 34px;
    bottom: 38px;
    left: 38px;
    border: 2px dashed var(--color-brand);
    border-radius: 2px;
    background: rgba(250, 85, 115, 0.05);
  }
  .cropbox i {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--color-brand);
  }
  .cropbox .tl {
    top: -5px;
    left: -5px;
  }
  .cropbox .tr {
    top: -5px;
    right: -5px;
  }
  .cropbox .bl {
    bottom: -5px;
    left: -5px;
  }
  .cropbox .br {
    bottom: -5px;
    right: -5px;
  }
  .cropchip {
    position: absolute;
    right: 12px;
    bottom: 11px;
    background: var(--color-brand);
    color: #fff;
    border-radius: 999px;
    padding: 4px 10px;
    font: 500 9px var(--font-sans);
  }

  /* 4 · tiny phone */
  .tinyphone {
    width: 96px;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 15px;
    border: 3px solid var(--color-ink);
    background: #fff;
    box-shadow: 0 2px 6px rgba(26, 23, 20, 0.14);
  }
  .tp-reload {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background: var(--color-brand);
    color: #fff;
    padding: 3px 0;
    font: 600 7px var(--font-sans);
  }
  .tp-body {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tp-body i {
    display: block;
    border-radius: 999px;
    background: #e4e4e7;
  }
  .tp-body .l1 {
    height: 6px;
    width: 60%;
  }
  .tp-body .blk {
    height: 36px;
    border-radius: 6px;
    background: var(--color-brand-dim);
    border: 1px solid rgba(250, 85, 115, 0.2);
  }
  .tp-body .l2 {
    height: 6px;
    width: 100%;
  }
  .tp-body .l3 {
    height: 6px;
    width: 40%;
  }

  /* 5 · PR sheet */
  .basechip {
    background: var(--color-surface);
    border-radius: 4px;
    padding: 1px 6px;
    font: 500 9px var(--font-mono);
    color: var(--color-ink);
  }
  .mlabel {
    font: 400 9px var(--font-sans);
    color: var(--color-dim);
  }
  .toggle {
    position: relative;
    height: 16px;
    width: 26px;
    flex: none;
    border-radius: 999px;
    background: #d8d5cd;
  }
  .toggle i {
    position: absolute;
    top: 2px;
    left: 2px;
    height: 12px;
    width: 12px;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  }

  /* 6 · problems */
  .probrow {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid rgba(214, 69, 69, 0.4);
    background: var(--color-elevated);
    border-radius: 6px;
    padding: 6px 8px;
    margin-top: 6px;
  }
  .probrow svg {
    flex: none;
    color: var(--color-danger);
  }
  .probrow .pn {
    font: 500 10px var(--font-sans);
    color: var(--color-ink);
  }
  .probrow .pm {
    margin-left: auto;
    font: 400 9px var(--font-sans);
    color: var(--color-dim);
  }

  /* ---------- pink frontend band ---------- */
  .frontends {
    background: var(--color-brand);
    color: #fff;
    padding: 30px 0 54px;
  }
  .frontends :global(::selection) {
    background: #fff;
    color: var(--color-ink);
  }
  .front-head {
    max-width: 1180px;
    margin: 0 auto 36px;
    padding: 0 32px;
  }
  .front-head h2 {
    color: #fff;
    margin-bottom: 10px;
  }
  .front-head p {
    font: 400 15.5px/1.6 var(--font-sans);
    color: rgba(255, 255, 255, 0.88);
    max-width: 62ch;
  }
  .fchip {
    background: rgba(0, 0, 0, 0.18);
    border-radius: 4px;
    padding: 1px 7px;
    font: 500 14px var(--font-sans);
    color: #fff;
    white-space: nowrap;
  }
  .front-head code {
    font: 500 14px var(--font-mono);
    background: rgba(0, 0, 0, 0.18);
    border-radius: 4px;
    padding: 1px 6px;
    color: #fff;
  }

  /* ---------- how it works ---------- */
  .howstack {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 38px;
  }
  .how {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    gap: 30px;
    padding: 30px;
  }
  .how-side {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .mode {
    font: 700 13px var(--font-mono);
    letter-spacing: 0.22em;
    color: var(--color-ink);
  }
  .mode::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    background: var(--color-brand);
    margin-right: 10px;
  }
  .how p {
    font: 400 14.5px/1.65 var(--font-sans);
    color: var(--color-muted);
    max-width: 70ch;
  }
  .how p code {
    font: 500 12.5px var(--font-mono);
    color: var(--color-ink);
    background: var(--color-surface);
    border: 1px solid var(--color-line);
    padding: 1px 6px;
    border-radius: 2px;
  }
  .how-term {
    margin-top: 22px;
  }
  .pricerow {
    margin-top: 14px;
  }
  .pricelink {
    font: 600 14.5px var(--font-sans);
    color: var(--color-ink);
    text-decoration: underline;
    text-decoration-color: var(--color-line-mid);
    text-underline-offset: 3px;
  }
  .pricelink:hover {
    text-decoration-color: var(--color-brand);
    color: var(--color-brand);
  }

  /* ---------- roadmap ---------- */
  .roadmap {
    padding-top: 24px;
  }
  .roadlead {
    margin-bottom: 36px;
  }

  /* ---------- final CTA ---------- */
  .cta {
    position: relative;
    text-align: center;
    padding-top: 130px;
    padding-bottom: 110px;
  }
  .seclabel.center {
    justify-content: center;
  }
  .yourmove {
    font-family: var(--font-pixel);
    font-size: 12px;
    color: var(--color-muted);
    letter-spacing: 0.14em;
  }
  .yourmove b {
    color: var(--color-brand);
    font-weight: 400;
  }
  .ctahead {
    font-size: clamp(34px, 4.8vw, 58px);
    letter-spacing: -0.03em;
    line-height: 1.05;
    margin-bottom: 16px;
  }
  .ctahead .pk {
    display: block;
  }
  .ctalead {
    margin: 0 auto 34px;
  }

  /* ---------- responsive ---------- */
  @media (max-width: 1020px) {
    .hero {
      grid-template-columns: 1fr;
      min-height: 0;
      padding-top: 60px;
      align-items: start;
    }
    .hero-copy {
      padding-bottom: 0;
    }
    .fgrid {
      grid-template-columns: 1fr;
      max-width: 560px;
    }
    .how {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .band {
      flex-direction: column;
      align-items: flex-start;
      gap: 18px;
    }
  }
  @media (max-width: 620px) {
    .sec {
      padding: 72px 18px;
    }
    .hero {
      padding: 44px 18px 12px;
    }
    .decisions {
      padding-top: 56px;
    }
    .eyebrow {
      gap: 8px;
    }
    .band {
      padding: 20px 18px;
    }
    .how {
      padding: 22px 18px;
    }
    .front-head {
      padding: 0 18px;
    }
    .fmock {
      height: auto;
      min-height: 180px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .mcaret {
      animation: none;
    }
  }
</style>
