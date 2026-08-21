<script>
  import { previewTitle, relativePreviewAge } from '$lib/workshop.js';

  let { phase, previews, error = '', openingToken = '', onopen } = $props();
</script>

<section id="previews" class="preview-section" aria-labelledby="preview-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Your workbench</p>
      <h2 id="preview-heading">Recent previews</h2>
    </div>
    {#if previews.length}
      <span class="count">{previews.length} live {previews.length === 1 ? 'preview' : 'previews'}</span>
    {/if}
  </div>

  {#if phase === 'loading'}
    <div class="preview-grid" aria-label="Loading previews">
      {#each [1, 2, 3] as item}
        <div class="preview-card skeleton" aria-hidden="true">
          <span></span><b></b><i></i>
        </div>
      {/each}
    </div>
  {:else if previews.length}
    <div class="preview-grid">
      {#each previews as preview}
        <article class="preview-card">
          <div class="preview-thumb" aria-hidden="true">
            <div class="thumb-bar"><i></i><i></i><i></i></div>
            <div class="thumb-canvas">
              <span></span>
              <b></b>
              <em></em>
            </div>
          </div>
          <div class="preview-meta">
            <div>
              <div class="status"><i></i> Live</div>
              <h3>{previewTitle(preview)}</h3>
              <p>{relativePreviewAge(preview.created_at)}</p>
            </div>
            <button type="button" disabled={openingToken === preview.token} onclick={() => onopen(preview)}>
              {openingToken === preview.token ? 'Opening…' : 'Reopen'} <span aria-hidden="true">↗</span>
            </button>
          </div>
        </article>
      {/each}
    </div>
  {:else}
    <div class="empty-preview">
      <div class="empty-art" aria-hidden="true">
        <span class="window-one"></span>
        <span class="window-two"></span>
        <i>+</i>
      </div>
      <div>
        <h3>Your first preview will live here.</h3>
        <p>Pick a web repository above. Once it is running, you can always find and reopen it from this workbench.</p>
      </div>
      <a href="#create">Create the first one <span aria-hidden="true">↑</span></a>
    </div>
  {/if}

  {#if error}<p class="preview-error" role="alert">{error}</p>{/if}
</section>

<style>
  .preview-section { padding: 70px 0 88px; scroll-margin-top: 24px; }
  .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
  .eyebrow { margin: 0 0 8px; color: #e23e5d; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
  h2 { margin: 0; font-size: clamp(27px, 4vw, 38px); font-weight: 600; letter-spacing: -.035em; }
  .count { color: var(--color-muted); font-size: 13px; }
  .preview-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .preview-card { min-width: 0; overflow: hidden; border: 1px solid var(--color-line); border-radius: 18px; background: var(--color-elevated); box-shadow: 0 10px 30px rgba(56, 43, 36, .05); }
  .preview-thumb { height: 150px; padding: 14px 14px 0; background: #f0ede6; border-bottom: 1px solid var(--color-line-subtle); }
  .thumb-bar { display: flex; gap: 4px; height: 20px; padding: 8px 8px 0; border-radius: 7px 7px 0 0; background: #292521; }
  .thumb-bar i { width: 4px; height: 4px; border-radius: 50%; background: #777068; }
  .thumb-bar i:first-child { background: #fa5573; }
  .thumb-canvas { position: relative; height: 116px; overflow: hidden; background: #fff; }
  .thumb-canvas::before { position: absolute; inset: 0; content: ''; background-image: linear-gradient(rgba(0,0,0,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.035) 1px, transparent 1px); background-size: 14px 14px; }
  .thumb-canvas span, .thumb-canvas b, .thumb-canvas em { position: absolute; display: block; border-radius: 3px; }
  .thumb-canvas span { top: 25px; left: 18px; width: 46%; height: 8px; background: #292521; }
  .thumb-canvas b { top: 42px; left: 18px; width: 33%; height: 5px; background: #cdc7bd; }
  .thumb-canvas em { right: 18px; bottom: 18px; width: 34px; height: 34px; background: #ffe0e6; border: 1px solid #ffc4cf; }
  .preview-meta { display: flex; align-items: end; justify-content: space-between; gap: 16px; padding: 17px; }
  .status { display: flex; align-items: center; gap: 6px; color: var(--color-success); font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
  .status i { width: 6px; height: 6px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 3px rgba(47,163,122,.1); }
  h3 { margin: 7px 0 3px; overflow: hidden; font-size: 15px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .preview-meta p { margin: 0; color: var(--color-muted); font-size: 11px; }
  .preview-meta button { flex: none; border: 1px solid var(--color-line); border-radius: 9px; padding: 8px 10px; background: var(--color-paper); color: var(--color-ink); font-size: 12px; font-weight: 600; transition: transform .15s, border-color .15s; }
  .preview-meta button:hover:not(:disabled) { transform: translateY(-1px); border-color: rgba(0,0,0,.24); }
  .preview-meta button:disabled { opacity: .55; }
  .empty-preview { display: grid; grid-template-columns: 130px 1fr auto; align-items: center; gap: 26px; min-height: 160px; padding: 28px; border: 1px dashed rgba(0,0,0,.17); border-radius: 20px; background: rgba(255,255,255,.48); }
  .empty-art { position: relative; height: 96px; }
  .empty-art span { position: absolute; width: 80px; height: 58px; border: 1px solid rgba(0,0,0,.13); border-radius: 8px; background: #fff; box-shadow: 0 7px 18px rgba(0,0,0,.05); }
  .window-one { top: 4px; left: 4px; transform: rotate(-5deg); }
  .window-two { right: 4px; bottom: 3px; transform: rotate(5deg); }
  .empty-art i { position: absolute; top: 31px; left: 50px; z-index: 2; display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; background: var(--color-brand); color: #fff; font-style: normal; font-size: 22px; box-shadow: 0 4px 12px rgba(250,85,115,.28); }
  .empty-preview h3 { margin: 0 0 6px; font-size: 17px; white-space: normal; }
  .empty-preview p { max-width: 540px; margin: 0; color: var(--color-muted); font-size: 13px; line-height: 1.55; }
  .empty-preview > a { color: var(--color-ink); font-size: 13px; font-weight: 600; text-decoration: none; white-space: nowrap; }
  .preview-error { margin: 14px 0 0; color: var(--color-danger); font-size: 13px; }
  .skeleton { height: 236px; padding: 18px; }
  .skeleton span, .skeleton b, .skeleton i { display: block; border-radius: 8px; background: linear-gradient(100deg, #ece8e1 30%, #f7f4ee 50%, #ece8e1 70%); background-size: 300% 100%; animation: shimmer 1.5s infinite; }
  .skeleton span { height: 140px; }.skeleton b { width: 60%; height: 12px; margin-top: 17px; }.skeleton i { width: 38%; height: 8px; margin-top: 9px; }
  @keyframes shimmer { to { background-position: -150% 0; } }
  @media (max-width: 800px) { .preview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.preview-grid .preview-card:last-child:nth-child(odd) { display: none; }.empty-preview { grid-template-columns: 100px 1fr; }.empty-preview > a { display: none; } }
  @media (max-width: 560px) { .preview-section { padding: 52px 0 66px; }.section-heading { align-items: start; }.count { padding-top: 9px; }.preview-grid { grid-template-columns: 1fr; }.preview-grid .preview-card:last-child:nth-child(odd) { display: block; }.preview-thumb { height: 170px; }.empty-preview { grid-template-columns: 1fr; gap: 14px; padding: 22px; }.empty-art { width: 130px; } }
  @media (prefers-reduced-motion: reduce) { .skeleton span, .skeleton b, .skeleton i { animation: none; } }
</style>
