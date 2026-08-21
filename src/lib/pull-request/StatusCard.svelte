<script>
  let { title, detail, children } = $props();
</script>

<div class="startup-card" aria-live="polite">
  <div class="startup-visual" aria-hidden="true">
    <div class="bench-grid"></div>
    <div class="window">
      <div class="window-bar"><i></i><i></i><i></i></div>
      <div class="window-body"><span></span><span></span><span></span><b></b></div>
    </div>
    <div class="tool"><span>✦</span></div>
    <div class="orbit"><i></i></div>
  </div>
  <div class="startup-copy">
    <p class="eyebrow"><i></i> Workshop in motion</p>
    <h1>{title}</h1>
    <p class="detail">{detail}</p>
    <div class="progress" aria-hidden="true"><span></span></div>
    <p class="permission">You can leave this tab open — we’ll keep moving.</p>
    {#if children}{@render children()}{/if}
  </div>
</div>

<style>
  .startup-card { display: grid; grid-template-columns: minmax(220px, .85fr) minmax(0, 1.15fr); overflow: hidden; border: 1px solid var(--color-line); border-radius: 22px; background: var(--color-elevated); box-shadow: 0 18px 50px rgba(56,43,36,.08); }
  .startup-visual { position: relative; min-height: 275px; overflow: hidden; border-right: 1px solid var(--color-line-subtle); background: #f0ede6; }
  .bench-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,0,0,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.045) 1px, transparent 1px); background-size: 22px 22px; }
  .window { position: absolute; top: 50%; left: 50%; width: 68%; overflow: hidden; border: 1px solid rgba(0,0,0,.15); border-radius: 10px; background: #fff; box-shadow: 12px 14px 0 rgba(42,37,33,.12); transform: translate(-50%, -50%) rotate(-3deg); animation: hover 3s ease-in-out infinite; }
  .window-bar { display: flex; gap: 4px; height: 25px; align-items: center; padding: 0 9px; background: #292521; }.window-bar i { width: 5px; height: 5px; border-radius: 50%; background: #68615b; }.window-bar i:first-child { background: var(--color-brand); }
  .window-body { height: 112px; padding: 23px 18px; }.window-body span { display: block; width: 68%; height: 6px; margin-bottom: 8px; border-radius: 3px; background: #d9d4cc; }.window-body span:first-child { width: 45%; background: #292521; }.window-body span:nth-child(3) { width: 55%; }.window-body b { display: block; width: 39px; height: 24px; margin-top: 15px; border-radius: 5px; background: var(--color-brand); }
  .tool { position: absolute; top: 34px; right: 22px; display: grid; width: 46px; height: 46px; place-items: center; border: 1px solid #ffc4cf; border-radius: 12px; background: #ffe8ed; color: var(--color-brand-muted); font-size: 20px; box-shadow: 0 8px 18px rgba(91,58,59,.12); animation: tool-bob 2.4s ease-in-out infinite; }
  .orbit { position: absolute; right: 28px; bottom: 24px; width: 42px; height: 42px; border: 1px dashed rgba(0,0,0,.2); border-radius: 50%; animation: spin 5s linear infinite; }.orbit i { position: absolute; top: -4px; left: 16px; width: 8px; height: 8px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 4px rgba(47,163,122,.1); }
  .startup-copy { align-self: center; padding: 36px; }.eyebrow { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }.eyebrow i { width: 7px; height: 7px; border-radius: 50%; background: var(--color-brand); animation: pulse 1.5s ease-in-out infinite; }
  h1 { margin: 0; font-size: clamp(24px, 4vw, 34px); font-weight: 600; letter-spacing: -.04em; }.detail { max-width: 430px; margin: 11px 0 23px; color: var(--color-muted); font-size: 14px; line-height: 1.55; }.progress { position: relative; height: 4px; overflow: hidden; border-radius: 99px; background: #ebe7df; }.progress span { position: absolute; inset-block: 0; width: 38%; border-radius: inherit; background: var(--color-brand); animation: progress 2.2s ease-in-out infinite; }.permission { margin: 10px 0 0; color: var(--color-dim); font-size: 10px; }
  @keyframes hover { 0%,100% { transform: translate(-50%,-50%) rotate(-3deg) translateY(0); } 50% { transform: translate(-50%,-50%) rotate(-2deg) translateY(-5px); } }
  @keyframes tool-bob { 0%,100% { transform: rotate(5deg) translateY(0); } 50% { transform: rotate(-3deg) translateY(5px); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 50% { opacity: .35; transform: scale(.8); } }
  @keyframes progress { 0% { left: -40%; } 55%,100% { left: 105%; } }
  @media (max-width: 620px) { .startup-card { grid-template-columns: 1fr; }.startup-visual { min-height: 190px; border-right: 0; border-bottom: 1px solid var(--color-line-subtle); }.window { width: 55%; }.window-body { height: 78px; padding: 14px; }.window-body b { margin-top: 8px; }.startup-copy { padding: 27px 24px 30px; } }
  @media (prefers-reduced-motion: reduce) { .window, .tool, .orbit, .eyebrow i, .progress span { animation: none; }.progress span { left: 31%; } }
</style>
