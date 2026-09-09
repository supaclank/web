<script>
  import Icon from './Icon.svelte';
  import { BUILD_TARGET, USAGE, INSTALL_COMMAND, PREVIEW_COMMAND } from '../onboarding/preferences.js';
  let { onstart } = $props();
  let target = $state(BUILD_TARGET.web);
  let usage = $state(USAGE.cloud);
  let prompt = $state('');
  let copied = $state(false);
  let error = $state('');
  const ideas = ['A website for my coffee shop', 'A habit tracker I’ll actually use', 'A portfolio that feels like me'];
  async function copy() {
    try { await navigator.clipboard.writeText(`${INSTALL_COMMAND}\n${PREVIEW_COMMAND}`); copied = true; }
    catch { error = 'Couldn’t copy. Select the commands to copy them manually.'; }
  }
  function start(event) {
    event.preventDefault();
    if (!prompt.trim()) return;
    onstart({ prompt, target, name: prompt.trim().split(/\s+/).slice(0, 5).join(' ').slice(0, 100) });
  }
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
      <div class="hero-heading"><h1 id="hero-title">A little idea.<br /><span>A whole new thing.</span></h1><p>Make websites and mobile apps. Just tell Clank what you have in mind.</p></div>
      <div class="prompt-canvas">
        <svg class="prompt-edges" viewBox="0 0 1100 300" preserveAspectRatio="none" aria-hidden="true">
          <path class:active={usage === USAGE.cloud} d="M200 82 C250 82 250 150 300 150" />
          <path class:active={usage === USAGE.local} d="M200 218 C250 218 250 150 300 150" />
          <path class:active={target === BUILD_TARGET.web} d="M800 150 C850 150 850 82 900 82" />
          <path class:active={target === BUILD_TARGET.mobile} d="M800 150 C850 150 850 218 900 218" />
          <circle cx="300" cy="150" r="4" /><circle cx="800" cy="150" r="4" />
        </svg>
        <fieldset class="canvas-options inputs"><legend>Where it runs</legend>
          <label class:chosen={usage === USAGE.cloud}><input type="radio" name="execution" value={USAGE.cloud} bind:group={usage} /><Icon name="cloud" /><span><strong>In the cloud</strong><small>Ready when you are</small></span><span class="selection-dot"></span></label>
          <label class:chosen={usage === USAGE.local}><input type="radio" name="execution" value={USAGE.local} bind:group={usage} /><Icon name="computer" /><span><strong>On my computer</strong><small>Free. Your own setup.</small></span><span class="selection-dot"></span></label>
        </fieldset>
        <div class="prompt-center">
          {#if usage === USAGE.cloud}
            <form class="idea-composer" onsubmit={start} data-umami-mask>
              <label class="sr-only" for="idea">What would you like to make?</label>
              <textarea id="idea" bind:value={prompt} maxlength="20000" placeholder="What would you like to make?" rows="4" required></textarea>
              <div class="composer-footer"><span><Icon name={target} size={16} />{target === BUILD_TARGET.web ? 'Website' : 'Mobile app'}<span class="composer-model" title="Starts with free, rate-limited OpenCode AI. Change your provider on the board.">Free AI</span></span><button class="send-button" type="submit" disabled={!prompt.trim()} aria-label="Start building"><Icon name="arrow" /></button></div>
            </form>
          {:else}
            <div class="local-composer"><h2>Your machine. Your possibilities.</h2><p>Run these in your project folder to open Clank.</p><pre><code>{`${INSTALL_COMMAND}\n${PREVIEW_COMMAND}`}</code></pre><button class="quiet-button" onclick={copy}><Icon name={copied ? 'check' : 'copy'} size={16} />{copied ? 'Copied' : 'Copy commands'}</button></div>
          {/if}
        </div>
        <fieldset class="canvas-options outputs"><legend>What you’re making</legend>
          <label class:chosen={target === BUILD_TARGET.web}><input type="radio" name="output" value={BUILD_TARGET.web} bind:group={target} /><Icon name="web" /><span><strong>A website</strong><small>Bring it to the browser</small></span><span class="selection-dot"></span></label>
          <label class:chosen={target === BUILD_TARGET.mobile}><input type="radio" name="output" value={BUILD_TARGET.mobile} bind:group={target} /><Icon name="mobile" /><span><strong>A mobile app</strong><small>Made to feel native</small></span><span class="selection-dot"></span></label>
        </fieldset>
      </div>
      {#if error}<p class="builder-error" role="alert">{error}</p>{/if}
      <div class="hero-followthrough">{#if usage === USAGE.cloud}<p>Seven days of cloud, on us. Your idea stays yours.</p><div class="idea-examples" aria-label="Try an idea">{#each ideas as idea}<button onclick={() => { prompt = idea; document.getElementById('idea')?.focus(); }}>{idea}<Icon name="arrow" size={14} /></button>{/each}</div>{:else}<p>Open source. Bring your own agent. No Clank subscription.</p>{/if}</div>
      <a class="below-canvas" href="#possibilities">Your next project starts here <Icon name="down" size={14} /></a>
    </section>
    <section class="possibilities" id="possibilities">
      <div><h2>From “what if”<br />to right in front of you.</h2><p>Talk through an idea, see it take shape, and keep making it yours. Your conversation and your app live together on one board.</p><button class="text-button" onclick={() => onstart(null)}>Open your board <Icon name="arrow" size={14} /></button></div>
      <div class="product-notes"><article><Icon name="web" /><h3>See what you’re making.</h3><p>A live website preview beside your conversation. Ask for a change and keep building.</p></article><article><Icon name="mobile" /><h3>Take it off the desktop.</h3><p>Build native apps with Expo. Preview in your browser, then try the real thing on your phone.</p><a href="https://play.google.com/store/apps/details?id=com.supaclank.clank" rel="noreferrer">Meet the Android app <Icon name="external" size={13} /></a></article><article><Icon name="github" /><h3>Keep the keys.</h3><p>Your code, your agent, your choice of cloud or local. Clank is open source from the start.</p><a href="https://github.com/supaclank/clank" rel="noreferrer">Explore the source <Icon name="external" size={13} /></a></article></div>
    </section>
  </main>
  <footer class="builder-footer"><a class="wordmark" href="/">clank</a><span>Room for your next idea.</span><nav><a href="/pricing">Pricing</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></nav></footer>
</div>
