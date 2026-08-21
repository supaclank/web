<script>
  import { previewTitle, relativePreviewAge } from '$lib/workshop.js';

  let { phase, previews, error = '', openingToken = '', onopen } = $props();
</script>

<section id="previews" class="preview-section" aria-labelledby="preview-heading">
  <header>
    <div><p>RECENT WORK</p><h2 id="preview-heading">Pick up where you left off</h2></div>
    {#if previews.length}<span>{previews.length} {previews.length === 1 ? 'preview' : 'previews'}</span>{/if}
  </header>

  {#if phase === 'loading'}
    <div class="preview-list" aria-label="Loading previews">
      {#each [1, 2, 3] as item}
        <div class="preview-row skeleton" aria-hidden="true"><i></i><span></span><b></b></div>
      {/each}
    </div>
  {:else if previews.length}
    <div class="preview-list">
      {#each previews as preview}
        <article class="preview-row">
          <div class="preview-thumb" aria-hidden="true"><span></span><i></i><b></b></div>
          <div class="preview-name"><h3>{previewTitle(preview)}</h3><p><i></i>Live · {relativePreviewAge(preview.created_at)}</p></div>
          <code>{preview.worktree_id?.slice(0, 8) || 'workspace'}</code>
          <button type="button" disabled={openingToken === preview.token} onclick={() => onopen(preview)}>
            {openingToken === preview.token ? 'Opening…' : 'Reopen'} <span aria-hidden="true">↗</span>
          </button>
        </article>
      {/each}
    </div>
  {:else}
    <div class="empty-preview">
      <div class="empty-art" aria-hidden="true"><span></span><i>＋</i></div>
      <div><h3>Your first preview will appear here.</h3><p>Describe a mobile app above or open a GitHub project. We’ll keep its live preview within reach.</p></div>
      <a href="#create">Create something <span aria-hidden="true">↑</span></a>
    </div>
  {/if}

  {#if error}<p class="preview-error" role="alert">{error}</p>{/if}
</section>

<style>
  .preview-section { max-width: 860px; margin: 0 auto; padding: 5px 0 80px; scroll-margin-top: 20px; }
  .preview-section > header { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 12px; border-bottom: 1px solid var(--color-line); padding: 0 2px 14px; }
  header p { margin: 0 0 5px; color: var(--color-brand-muted); font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 650; letter-spacing: .1em; }
  h2 { margin: 0; font-size: 22px; font-weight: 620; letter-spacing: -.035em; }
  header > span { color: var(--color-dim); font-size: 10px; }
  .preview-list { display: grid; }
  .preview-row { display: grid; grid-template-columns: 48px minmax(160px, 1fr) minmax(88px, .35fr) auto; align-items: center; gap: 13px; min-height: 72px; border-bottom: 1px solid var(--color-line-subtle); padding: 8px 3px; }
  .preview-row:hover { background: rgba(255,255,255,.38); }
  .preview-thumb { position: relative; width: 43px; height: 38px; overflow: hidden; border: 1px solid var(--color-line); border-radius: 8px; background: #fff; }
  .preview-thumb::before { position: absolute; inset: 0; content: ''; background-image: linear-gradient(rgba(0,0,0,.035) 1px, transparent 1px), linear-gradient(90deg,rgba(0,0,0,.035) 1px,transparent 1px); background-size: 8px 8px; }
  .preview-thumb span, .preview-thumb i, .preview-thumb b { position: absolute; left: 8px; z-index: 1; display: block; height: 3px; border-radius: 2px; }
  .preview-thumb span { top: 12px; width: 24px; background: #2d2824; }
  .preview-thumb i { top: 19px; width: 16px; background: #c7c0b7; }
  .preview-thumb b { right: 6px; bottom: 5px; left: auto; width: 9px; height: 9px; background: #ffd3dc; }
  .preview-name { min-width: 0; }
  .preview-name h3 { overflow: hidden; margin: 0 0 5px; font-size: 12px; font-weight: 640; text-overflow: ellipsis; white-space: nowrap; }
  .preview-name p { display: flex; align-items: center; gap: 6px; margin: 0; color: var(--color-dim); font-size: 9px; }
  .preview-name p i { width: 6px; height: 6px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 2px rgba(47,163,122,.1); }
  .preview-row code { overflow: hidden; color: var(--color-dim); font-family: 'JetBrains Mono', monospace; font-size: 8px; text-overflow: ellipsis; }
  .preview-row button { min-height: 36px; border: 1px solid var(--color-line); border-radius: 9px; padding: 0 11px; background: rgba(255,255,255,.72); color: var(--color-ink); font-size: 10px; font-weight: 620; }
  .preview-row button:hover:not(:disabled) { border-color: rgba(0,0,0,.25); background: #fff; }
  .preview-row button:disabled { opacity: .5; }
  .preview-row button span { color: var(--color-brand-muted); }
  .empty-preview { display: grid; grid-template-columns: 52px 1fr auto; align-items: center; gap: 16px; min-height: 112px; border-bottom: 1px solid var(--color-line-subtle); padding: 17px 3px; }
  .empty-art { position: relative; width: 46px; height: 42px; border: 1px dashed rgba(0,0,0,.2); border-radius: 9px; background: rgba(255,255,255,.52); }
  .empty-art span { position: absolute; top: 10px; left: 9px; width: 22px; height: 4px; border-radius: 2px; background: #c9c2b9; }
  .empty-art i { position: absolute; right: -5px; bottom: -5px; display: grid; width: 21px; height: 21px; place-items: center; border-radius: 50%; background: var(--color-brand); color: #fff; font-style: normal; font-size: 12px; }
  .empty-preview h3 { margin: 0 0 4px; font-size: 12px; }
  .empty-preview p { max-width: 520px; margin: 0; color: var(--color-muted); font-size: 10px; line-height: 1.5; }
  .empty-preview > a { color: var(--color-ink); font-size: 10px; font-weight: 620; text-decoration: none; white-space: nowrap; }
  .empty-preview > a span { color: var(--color-brand-muted); }
  .preview-error { margin: 12px 0 0; color: var(--color-danger); font-size: 10px; }
  .skeleton i, .skeleton span, .skeleton b { display: block; height: 10px; border-radius: 5px; background: #ebe7df; }
  .skeleton i { width: 43px; height: 38px; }.skeleton span { width: 55%; }.skeleton b { width: 45%; }
  @media (max-width: 650px) {
    .preview-section { padding-bottom: 95px; }
    .preview-row { grid-template-columns: 44px minmax(0,1fr) auto; gap: 10px; }
    .preview-row code { display: none; }
    .empty-preview { grid-template-columns: 48px 1fr; }
    .empty-preview > a { display: none; }
  }
</style>
