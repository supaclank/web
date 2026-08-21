<script>
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
  <a href="/welcome" class="brand"><img src="/mascot.png" alt="" width="34" height="34" /><span>supaclank</span></a>

  <div class="workspace-label">
    <span>P</span><div><small>Workspace</small><b>Personal</b></div><i aria-hidden="true">⌄</i>
  </div>

  <nav aria-label="Workspace navigation">
    <a class="active" href="#create"><i aria-hidden="true">⌂</i>Home</a>
    <a href="#previews"><i aria-hidden="true">▣</i>Recent previews <span>{previewCount}</span></a>
    <a href="#create" onclick={() => { document.querySelector('#mobile-mode')?.click(); setTimeout(() => document.querySelector('#app-prompt')?.focus()); }}><i aria-hidden="true">＋</i>New mobile app</a>
    <a href="#create" onclick={() => { document.querySelector('#web-mode')?.click(); setTimeout(() => document.querySelector('#repository')?.focus()); }}><i aria-hidden="true">⌘</i>Open repository</a>
    <a href="/demo"><i aria-hidden="true">◇</i>Interactive demo</a>
  </nav>

  <div class="sidebar-bottom">
    <div class="plan-line" class:attention={needsPay}>
      <span><i></i>{active ? 'Pro account' : needsPay ? 'Workspace paused' : 'Free trial'}</span>
      <button type="button" disabled={busy} onclick={active ? onmanage : onsubscribe}>{planLabel}</button>
    </div>
    {#if error}<small class="billing-error">{error}</small>{/if}

    <details class="account">
      <summary><span>{initial}</span><div><b>{email}</b><small>Personal account</small></div><i aria-hidden="true">•••</i></summary>
      <div class="account-menu">
        {#if active}<button type="button" onclick={onmanage} disabled={busy}>Manage subscription</button>{:else}<button type="button" onclick={onsubscribe} disabled={busy}>{needsPay ? 'Renew workspace' : 'Upgrade plan'}</button>{/if}
        <button type="button" onclick={onsignout}>Sign out</button>
      </div>
    </details>
  </div>
</aside>

<nav class="mobile-nav" aria-label="Mobile workspace navigation">
  <a class="active" href="#create"><span>⌂</span>Home</a>
  <a href="#previews"><span>▣</span>Previews</a>
  <a class="create" href="#create"><span>＋</span>Create</a>
  <a href="/demo"><span>◇</span>Demo</a>
</nav>

<style>
  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 20; display: flex; width: 214px; flex-direction: column; border-right: 1px solid var(--color-line-subtle); padding: 18px 13px 13px; background: rgba(250, 248, 244, .96); backdrop-filter: blur(16px); }
  .brand { display: flex; align-items: center; gap: 9px; padding: 0 7px 18px; color: var(--color-ink); font-size: 14px; font-weight: 670; letter-spacing: -.025em; text-decoration: none; }
  .brand img { border-radius: 10px; }
  .workspace-label { display: flex; align-items: center; gap: 9px; margin: 0 3px 17px; border-bottom: 1px solid var(--color-line-subtle); padding: 8px 5px 14px; }
  .workspace-label > span { display: grid; width: 29px; height: 29px; flex: none; place-items: center; border-radius: 8px; background: #ffe4e9; color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 650; }
  .workspace-label > div { min-width: 0; flex: 1; }
  .workspace-label small, .workspace-label b { display: block; }
  .workspace-label small { color: var(--color-dim); font-size: 8px; }
  .workspace-label b { margin-top: 1px; font-size: 10px; font-weight: 650; }
  .workspace-label > i { color: var(--color-dim); font-style: normal; font-size: 10px; }
  nav { display: grid; gap: 2px; margin: 0; }
  nav a { display: flex; min-height: 39px; align-items: center; gap: 10px; border-radius: 9px; padding: 0 10px; color: var(--color-muted); font-size: 10px; font-weight: 520; text-decoration: none; }
  nav a:hover { background: rgba(45, 37, 31, .04); color: var(--color-ink); }
  nav a.active { background: #fff; color: var(--color-ink); box-shadow: 0 2px 7px rgba(47, 38, 32, .055); }
  nav a > i { display: grid; width: 17px; place-items: center; color: var(--color-dim); font-style: normal; font-size: 13px; }
  nav a > span { margin-left: auto; border-radius: 99px; padding: 2px 6px; background: #ece8e1; color: var(--color-dim); font-size: 8px; }
  .sidebar-bottom { margin-top: auto; }
  .plan-line { display: flex; align-items: center; justify-content: space-between; gap: 7px; margin: 0 5px 8px; border-bottom: 1px solid var(--color-line-subtle); padding: 0 3px 12px; }
  .plan-line > span { display: flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: 8px; }
  .plan-line > span i { width: 6px; height: 6px; border-radius: 50%; background: var(--color-success); }
  .plan-line.attention > span i { background: var(--color-danger); }
  .plan-line button { border: 0; padding: 3px; background: transparent; color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 7px; font-weight: 650; text-transform: uppercase; }
  .billing-error { display: block; margin: 0 8px 8px; color: var(--color-danger); font-size: 8px; line-height: 1.35; }
  .account { position: relative; }
  .account summary { display: flex; align-items: center; gap: 8px; border-radius: 9px; padding: 7px; cursor: pointer; list-style: none; }
  .account summary:hover { background: rgba(45, 37, 31, .04); }
  .account summary::-webkit-details-marker { display: none; }
  .account summary > span { display: grid; width: 29px; height: 29px; flex: none; place-items: center; border-radius: 50%; background: var(--color-ink); color: #fff; font-size: 9px; font-weight: 650; }
  .account summary > div { min-width: 0; flex: 1; }
  .account summary b, .account summary small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .account summary b { font-size: 9px; font-weight: 620; }
  .account summary small { margin-top: 2px; color: var(--color-dim); font-size: 8px; }
  .account summary > i { color: var(--color-dim); font-style: normal; font-size: 8px; }
  .account-menu { position: absolute; right: 0; bottom: 46px; left: 0; z-index: 3; border: 1px solid var(--color-line); border-radius: 10px; padding: 6px; background: #fff; box-shadow: 0 14px 32px rgba(32,25,20,.13); }
  .account-menu button { width: 100%; border: 0; border-radius: 7px; padding: 9px; background: transparent; text-align: left; font-size: 9px; }
  .account-menu button:hover { background: var(--color-surface); }
  .mobile-nav { display: none; }
  @media (max-width: 760px) {
    .sidebar { display: none; }
    .mobile-nav { position: fixed; right: 10px; bottom: 10px; left: 10px; z-index: 30; display: grid; grid-template-columns: repeat(4, 1fr); margin: 0; border: 1px solid var(--color-line); border-radius: 15px; padding: 6px; background: rgba(255,255,255,.94); box-shadow: 0 10px 30px rgba(0,0,0,.14); backdrop-filter: blur(15px); }
    .mobile-nav a { display: flex; min-height: 46px; flex-direction: column; justify-content: center; gap: 2px; padding: 0; font-size: 8px; }
    .mobile-nav a span { margin: 0; padding: 0; background: transparent; font-size: 15px; }
    .mobile-nav a.active { box-shadow: none; }
    .mobile-nav a.create { background: var(--color-brand); color: #fff; }
  }
</style>
