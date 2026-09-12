<script>
  import Icon from './Icon.svelte';
  import PromptCanvas from './PromptCanvas.svelte';
  import Demo from './demo/Demo.svelte';
  import { USAGE } from '../onboarding/preferences.js';
  let { onstart } = $props();
  let usage = $state(USAGE.cloud);
  let prompt = $state('');
  const ideas = ['A website for my coffee shop', 'A habit tracker I’ll actually use', 'A portfolio that feels like me'];
</script>

<div class="landing">
  <header class="builder-header">
    <a class="wordmark" href="/"><img src="/mascot.png" alt="" width="30" height="30" />clank</a>
    <nav aria-label="Main"><a href="/pricing">Pricing</a><a href="https://github.com/supaclank/clank" rel="noreferrer" class="source-link"><Icon name="github" size={17} />Open source</a></nav>
    <button class="quiet-button" onclick={() => onstart(null)}>Sign in <Icon name="arrow" size={14} /></button>
  </header>

  <main>
    <section class="landing-hero" aria-labelledby="hero-title">
      <div class="canvas-dots" aria-hidden="true"></div>
      <div class="hero-heading"><h1 id="hero-title">Build apps.{' '}<span>Keep your code.</span></h1><p>Websites and native apps, built with an agent.<br />Open source. In the cloud or on your machine.</p></div>
      <div class="landing-prompt"><PromptCanvas bind:prompt bind:usage {onstart} /></div>
      <div class="hero-followthrough">{#if usage === USAGE.cloud}<p>Seven days of cloud, on us. Your idea stays yours.</p><div class="idea-examples" aria-label="Try an idea">{#each ideas as idea}<button onclick={() => { prompt = idea; document.querySelector('.landing-prompt textarea')?.focus(); }}>{idea}<Icon name="arrow" size={14} /></button>{/each}</div>{:else}<p>Open source. Bring your own agent. No Clank subscription.</p>{/if}</div>

    </section>
    <Demo />
    <section class="possibilities" id="possibilities">
      <div><h2>From “what if”<br />to right in front of you.</h2><p>Talk through an idea, see it take shape, and keep making it yours. Your conversation and your app live together on one board.</p><button class="text-button" onclick={() => onstart(null)}>Open your board <Icon name="arrow" size={14} /></button></div>
      <div class="product-notes"><article><Icon name="web" /><h3>See what you’re making.</h3><p>A live website preview beside your conversation. Ask for a change and keep building.</p></article><article><Icon name="mobile" /><h3>Take it off the desktop.</h3><p>Build native apps with Expo. Install Clank on your Android phone, then scan the QR code to try your app.</p><a href="https://play.google.com/store/apps/details?id=com.supaclank.clank" rel="noreferrer">Meet the Android app <Icon name="external" size={13} /></a></article><article><Icon name="github" /><h3>Keep the keys.</h3><p>Your code, your agent, your choice of cloud or local. Clank is open source from the start.</p><a href="https://github.com/supaclank/clank" rel="noreferrer">Explore the source <Icon name="external" size={13} /></a></article></div>
    </section>
  </main>
  <footer class="builder-footer"><a class="wordmark" href="/">clank</a><span>Room for your next idea.</span><nav><a href="/pricing">Pricing</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></nav></footer>
</div>
