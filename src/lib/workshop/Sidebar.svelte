<script>
  import { PLAY_STORE_URL } from '$lib/demo/tutorial.js';

  let {
    email,
    planLabel,
    previewCount,
    needsPay = false,
    active = false,
    busy = false,
    error = '',
    onsubscribe,
    onmanage,
    onsignout
  } = $props();

  let initial = $derived(email.slice(0, 1).toUpperCase());
</script>

<aside class="sidebar">
  <a href="/welcome" class="brand">
    <img src="/mascot.png" alt="" width="34" height="34" />
    <span>supaclank</span>
  </a>

  <div class="workspace-switcher">
    <span class="workspace-icon">P</span>
    <span><small>Workspace</small><b>Personal</b></span>
    <i>⌄</i>
  </div>

  <nav aria-label="Workspace navigation">
    <p>Workspace</p>
    <a class="active" href="#dashboard"><span class="nav-icon">⌂</span>Overview</a>
    <a href="#previews"><span class="nav-icon">▣</span>Previews <em>{previewCount}</em></a>
    <a href="#create"><span class="nav-icon">＋</span>Create new</a>

    <p class="second">Builders</p>
    <a href="#web-builder"><span class="product-dot web"></span>Web workspace</a>
    <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer"><span class="product-dot mobile"></span>Mobile app <i>↗</i></a>
    <a href="/demo"><span class="nav-icon">◇</span>Interactive demo</a>
  </nav>

  <div class="sidebar-bottom">
    <div class:attention={needsPay} class="plan-card">
      <div><span>{needsPay ? 'Workshop paused' : active ? 'Pro workspace' : 'Free trial'}</span><b>{planLabel}</b></div>
      <button type="button" disabled={busy} onclick={active ? onmanage : onsubscribe}>
        {active ? 'Manage' : needsPay ? 'Renew' : 'Upgrade'}
      </button>
      {#if error}<small>{error}</small>{/if}
    </div>

    <details class="account">
      <summary><span>{initial}</span><div><b>{email}</b><small>Account settings</small></div><i>•••</i></summary>
      <div class="account-menu">
        {#if active}<button type="button" onclick={onmanage} disabled={busy}>Manage subscription</button>{:else}<button type="button" onclick={onsubscribe} disabled={busy}>Manage plan</button>{/if}
        <button type="button" onclick={onsignout}>Sign out</button>
      </div>
    </details>
  </div>
</aside>

<nav class="mobile-nav" aria-label="Mobile workspace navigation">
  <a class="active" href="#dashboard"><span>⌂</span>Home</a>
  <a href="#previews"><span>▣</span>Previews</a>
  <a class="create" href="#create"><span>＋</span>Create</a>
  <a href="/demo"><span>◇</span>Demo</a>
</nav>

<style>
  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 20; display: flex; width: 244px; flex-direction: column; border-right: 1px solid var(--color-line-subtle); padding: 20px 16px 14px; background: #f7f5f0; }
  .brand { display: flex; align-items: center; gap: 10px; padding: 0 8px 20px; color: var(--color-ink); font-size: 15px; font-weight: 650; letter-spacing: -.025em; text-decoration: none; }.brand img { border-radius: 10px; }
  .workspace-switcher { display: flex; align-items: center; gap: 9px; border: 1px solid var(--color-line); border-radius: 10px; padding: 9px; background: #fff; box-shadow: 0 2px 6px rgba(36,29,24,.03); }.workspace-icon { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 7px; background: #ffe5ea; color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; }.workspace-switcher > span:nth-child(2) { min-width: 0; flex: 1; }.workspace-switcher small, .workspace-switcher b { display: block; }.workspace-switcher small { color: var(--color-dim); font-size: 9px; }.workspace-switcher b { margin-top: 1px; font-size: 11px; font-weight: 600; }.workspace-switcher > i { color: var(--color-dim); font-style: normal; font-size: 11px; }
  nav { margin-top: 23px; }nav p { margin: 0 9px 8px; color: var(--color-dim); font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 600; letter-spacing: .09em; text-transform: uppercase; }nav p.second { margin-top: 25px; }nav a { display: flex; min-height: 37px; align-items: center; gap: 10px; border-radius: 8px; padding: 0 9px; color: var(--color-muted); font-size: 11px; font-weight: 500; text-decoration: none; }nav a:hover { background: rgba(0,0,0,.035); color: var(--color-ink); }nav a.active { background: #fff; color: var(--color-ink); box-shadow: 0 1px 4px rgba(0,0,0,.05); }nav a em { margin-left: auto; border-radius: 99px; padding: 2px 6px; background: #ece9e3; color: var(--color-muted); font-style: normal; font-size: 8px; }nav a i { margin-left: auto; color: var(--color-dim); font-style: normal; }.nav-icon { display: grid; width: 17px; height: 17px; place-items: center; color: var(--color-dim); font-size: 14px; }.product-dot { width: 8px; height: 8px; margin: 0 4px; border-radius: 3px; }.product-dot.web { background: var(--color-brand); box-shadow: 0 0 0 3px rgba(250,85,115,.11); }.product-dot.mobile { background: #2f2925; box-shadow: 0 0 0 3px rgba(47,41,37,.09); }
  .sidebar-bottom { margin-top: auto; }.plan-card { margin-bottom: 9px; border: 1px solid var(--color-line); border-radius: 10px; padding: 11px; background: #fff; }.plan-card > div { display: flex; align-items: center; justify-content: space-between; gap: 8px; }.plan-card span { color: var(--color-muted); font-size: 9px; }.plan-card b { color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; }.plan-card button { width: 100%; margin-top: 9px; border: 0; border-radius: 7px; padding: 7px; background: #2d2824; color: #fff; font-size: 9px; font-weight: 600; }.plan-card.attention { border-color: rgba(214,80,79,.25); background: #fff6f6; }.plan-card.attention button { background: var(--color-danger); }.plan-card small { display: block; margin-top: 7px; color: var(--color-danger); font-size: 8px; line-height: 1.35; }
  .account { position: relative; }.account summary { display: flex; align-items: center; gap: 9px; border-radius: 9px; padding: 8px; cursor: pointer; list-style: none; }.account summary:hover { background: rgba(0,0,0,.035); }.account summary::-webkit-details-marker { display: none; }.account summary > span { display: grid; width: 29px; height: 29px; flex: none; place-items: center; border-radius: 8px; background: var(--color-brand); color: #fff; font-size: 10px; font-weight: 650; }.account summary > div { min-width: 0; flex: 1; }.account summary b, .account summary small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.account summary b { font-size: 9px; font-weight: 600; }.account summary small { margin-top: 2px; color: var(--color-dim); font-size: 8px; }.account summary > i { color: var(--color-dim); font-style: normal; font-size: 8px; letter-spacing: .05em; }.account-menu { position: absolute; right: 0; bottom: 47px; left: 0; z-index: 3; border: 1px solid var(--color-line); border-radius: 9px; padding: 6px; background: #fff; box-shadow: 0 12px 30px rgba(32,25,20,.12); }.account-menu button { width: 100%; border: 0; border-radius: 6px; padding: 8px; background: transparent; text-align: left; font-size: 9px; }.account-menu button:hover { background: var(--color-surface); }
  .mobile-nav { display: none; }
  @media (max-width: 760px) { .sidebar { display: none; }.mobile-nav { position: fixed; right: 10px; bottom: 10px; left: 10px; z-index: 30; display: grid; grid-template-columns: repeat(4, 1fr); margin: 0; border: 1px solid var(--color-line); border-radius: 15px; padding: 6px; background: rgba(255,255,255,.94); box-shadow: 0 10px 30px rgba(0,0,0,.14); backdrop-filter: blur(15px); }.mobile-nav a { display: flex; min-height: 46px; flex-direction: column; justify-content: center; gap: 2px; padding: 0; font-size: 8px; }.mobile-nav a span { font-size: 15px; }.mobile-nav a.active { box-shadow: none; }.mobile-nav a.create { background: var(--color-brand); color: #fff; } }
</style>
