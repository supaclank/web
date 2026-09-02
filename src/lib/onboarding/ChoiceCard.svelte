<script>
  import ChoiceIcon from './ChoiceIcon.svelte';
  let { kind, title, caption, type, name, checked, onchange, showInterface = true } = $props();
</script>

<label class="choice relative flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl bg-transparent px-3 py-6 text-center sm:min-h-40 {checked ? 'border-2 border-dashed border-brand' : 'border-2 border-solid border-transparent ring-1 ring-line ring-inset hover:ring-ink/25'}">
  <input {type} {name} value={kind} {checked} {onchange} aria-label={title} class="sr-only" />
  <span aria-hidden="true" class="absolute top-3 right-3 flex h-5 w-5 items-center justify-center border {type === 'checkbox' ? 'rounded-md' : 'rounded-full'} {checked ? 'border-brand bg-brand text-white' : 'border-line bg-transparent'}">
    {#if checked}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="m2.5 6 2.25 2.25L9.5 3.5" />
      </svg>
    {/if}
  </span>
  <span class="text-muted"><ChoiceIcon {kind} {showInterface} /></span>
  <span class="mt-4 text-sm font-medium tracking-tight sm:text-base">{title}</span>
  {#if caption}<span class="mt-1.5 text-xs text-muted">{caption}</span>{/if}
</label>

<style>
  .choice:not(:has(input:checked)):has(input:focus-visible) { border-color: var(--color-brand); }
</style>
