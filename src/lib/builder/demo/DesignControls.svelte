<script>
  import { SESSION_VIEWS } from './session-views.js';
  let { variant = $bindable(), onstep } = $props();
</script>
<div class="session-design-controls">
  <div role="group" aria-label="Session view versions">{#each SESSION_VIEWS as view, index}<button type="button" aria-pressed={variant === view.id} onclick={() => variant = view.id}>{index + 1}. {view.label}</button>{/each}</div>
  <p>{SESSION_VIEWS.find(view => view.id === variant).description} <button type="button" onclick={onstep}>Next action →</button></p>
</div>
<style>
  .session-design-controls { margin: 0 0 14px; }
  .session-design-controls > div { display: flex; flex-wrap: wrap; gap: 6px; }
  .session-design-controls button { padding: 6px 9px; border: 1px solid #444; border-radius: 5px; font-size: 12px; color: #bdbdbd; background: #1b1b1b; transition: background 160ms, border-color 160ms, color 160ms; }
  .session-design-controls button[aria-pressed='true'] { background: #ededed; border-color: #ededed; color: #181818; }
  .session-design-controls p { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 10px; color: #bdbdbd; font-size: 12px; line-height: 1.5; }
  @media (prefers-reduced-motion: reduce) { .session-design-controls button { transition: none; } }
</style>
