<script>
  import { previewTitle, relativePreviewAge } from '$lib/workshop.js';

  let { phase, previews, error = '', openingToken = '', onopen } = $props();
</script>

<section id="previews" class="preview-panel" aria-labelledby="preview-heading">
  <header>
    <div>
      <p>Recent work</p>
      <h2 id="preview-heading">Your previews</h2>
    </div>
    <a href="#create">New preview <span>＋</span></a>
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
          <div class="preview-icon" aria-hidden="true"><span></span><i></i><b></b></div>
          <div class="preview-name">
            <h3>{previewTitle(preview)}</h3>
            <p><span></span>Live preview · {relativePreviewAge(preview.created_at)}</p>
          </div>
          <div class="type"><span>WEB</span><small>Private</small></div>
          <code>{preview.worktree_id?.slice(0, 8) || 'workspace'}</code>
          <button type="button" disabled={openingToken === preview.token} onclick={() => onopen(preview)}>
            {openingToken === preview.token ? 'Opening…' : 'Open'} <span>↗</span>
          </button>
        </article>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon"><span></span><i>＋</i></div>
      <div><h3>No previews yet</h3><p>Open a GitHub project below and your live previews will be kept here for next time.</p></div>
      <a href="#web-builder">Open a project <span>→</span></a>
    </div>
  {/if}

  {#if error}<p class="preview-error" role="alert">{error}</p>{/if}
</section>

<style>
  .preview-panel { scroll-margin-top: 24px; border: 1px solid var(--color-line); border-radius: 14px; background: #fff; box-shadow: 0 4px 16px rgba(43,34,28,.035); }.preview-panel > header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 18px 20px; border-bottom: 1px solid var(--color-line-subtle); }.preview-panel header p { margin: 0 0 3px; color: var(--color-dim); font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }.preview-panel h2 { margin: 0; font-size: 17px; font-weight: 620; letter-spacing: -.02em; }.preview-panel header a { border: 1px solid var(--color-line); border-radius: 8px; padding: 7px 9px; color: var(--color-ink); font-size: 9px; font-weight: 600; text-decoration: none; }.preview-panel header a span { color: var(--color-brand-muted); }
  .preview-list { padding: 4px 10px; }.preview-row { display: grid; grid-template-columns: 42px minmax(145px, 1.4fr) minmax(76px, .5fr) minmax(82px, .55fr) auto; align-items: center; gap: 13px; min-height: 67px; border-bottom: 1px solid var(--color-line-subtle); padding: 8px 9px; }.preview-row:last-child { border-bottom: 0; }.preview-row:hover { border-radius: 9px; background: #fbfaf7; }.preview-icon { position: relative; width: 38px; height: 34px; overflow: hidden; border: 1px solid var(--color-line); border-radius: 7px; background: #faf8f4; }.preview-icon::before { position: absolute; inset: 0; content: ''; background-image: linear-gradient(rgba(0,0,0,.035) 1px, transparent 1px), linear-gradient(90deg,rgba(0,0,0,.035) 1px,transparent 1px); background-size: 7px 7px; }.preview-icon span, .preview-icon i, .preview-icon b { position: absolute; left: 7px; z-index: 1; display: block; height: 3px; border-radius: 2px; }.preview-icon span { top: 11px; width: 21px; background: #2d2824; }.preview-icon i { top: 17px; width: 14px; background: #c7c0b7; }.preview-icon b { right: 6px; bottom: 5px; left: auto; width: 8px; height: 8px; background: #ffd3dc; }.preview-name { min-width: 0; }.preview-name h3 { overflow: hidden; margin: 0 0 5px; font-size: 11px; font-weight: 620; text-overflow: ellipsis; white-space: nowrap; }.preview-name p { display: flex; align-items: center; gap: 5px; margin: 0; color: var(--color-dim); font-size: 8px; }.preview-name p span { width: 5px; height: 5px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 2px rgba(47,163,122,.1); }.type span, .type small { display: block; }.type span { color: var(--color-muted); font-family: 'JetBrains Mono', monospace; font-size: 7px; font-weight: 600; }.type small { margin-top: 4px; color: var(--color-dim); font-size: 8px; }.preview-row code { overflow: hidden; color: var(--color-dim); font-family: 'JetBrains Mono', monospace; font-size: 8px; text-overflow: ellipsis; }.preview-row button { border: 1px solid var(--color-line); border-radius: 7px; padding: 7px 9px; background: #fff; color: var(--color-ink); font-size: 9px; font-weight: 600; }.preview-row button:hover:not(:disabled) { border-color: rgba(0,0,0,.24); }.preview-row button:disabled { opacity: .5; }.preview-row button span { color: var(--color-brand-muted); }
  .empty-state { display: grid; grid-template-columns: 48px 1fr auto; align-items: center; gap: 15px; min-height: 116px; padding: 20px; }.empty-icon { position: relative; width: 44px; height: 40px; border: 1px dashed rgba(0,0,0,.2); border-radius: 8px; background: #faf8f4; }.empty-icon span { position: absolute; top: 9px; left: 8px; width: 20px; height: 4px; border-radius: 2px; background: #c9c2b9; }.empty-icon i { position: absolute; right: -5px; bottom: -5px; display: grid; width: 20px; height: 20px; place-items: center; border-radius: 50%; background: var(--color-brand); color: #fff; font-style: normal; font-size: 12px; }.empty-state h3 { margin: 0 0 4px; font-size: 11px; }.empty-state p { max-width: 470px; margin: 0; color: var(--color-muted); font-size: 9px; line-height: 1.5; }.empty-state > a { border: 1px solid var(--color-line); border-radius: 8px; padding: 8px 10px; color: var(--color-ink); font-size: 9px; font-weight: 600; text-decoration: none; }.empty-state > a span { color: var(--color-brand-muted); }.preview-error { margin: 0; border-top: 1px solid rgba(214,80,79,.14); padding: 10px 20px; color: var(--color-danger); font-size: 9px; }
  .skeleton i, .skeleton span, .skeleton b { display: block; height: 10px; border-radius: 5px; background: #eeebe5; }.skeleton i { width: 38px; height: 34px; }.skeleton span { width: 65%; }.skeleton b { width: 45%; }
  @media (max-width: 900px) { .preview-row { grid-template-columns: 42px minmax(130px,1fr) 70px auto; }.preview-row code { display: none; } }
  @media (max-width: 560px) { .preview-panel > header { padding: 15px; }.preview-list { padding: 3px 7px; }.preview-row { grid-template-columns: 39px minmax(0,1fr) auto; gap: 10px; padding: 8px 6px; }.preview-row .type, .preview-row code { display: none; }.preview-row button { padding: 7px; }.preview-row button span { display: none; }.empty-state { grid-template-columns: 42px 1fr; padding: 18px 15px; }.empty-state > a { display: none; } }
</style>
