<script>
  import { untrack } from 'svelte';
  import InputGraph from './InputGraph.svelte';
  import Icon from './Icon.svelte';
  import { GRAPH_PORT } from './graph-ports.js';
  import { PROJECT_MODE } from './model.js';
  import { IMAGE_MIMES, readImageFiles, repositoryLocator } from './image-inputs.js';
  import { BUILD_TARGET, USAGE, INSTALL_COMMAND, PREVIEW_COMMAND } from '../onboarding/preferences.js';
  import './prompt-canvas.css';
  let { initial = null, prompt = $bindable(''), usage = $bindable(USAGE.cloud), onstart, disabled = false, sourceLocked = false, cloudOnly = false, isWorking = false } = $props();
  let mode = $state(untrack(() => initial?.repository ? PROJECT_MODE.import : PROJECT_MODE.new));
  let repository = $state(untrack(() => initial?.repository || ''));
  let images = $state(untrack(() => initial?.images || []));
  let target = $state(untrack(() => initial?.target || BUILD_TARGET.web));
  let error = $state('');
  let isReading = $state(false);
  let isSubmitting = $state(false);
  let isDropping = $state(false);
  let copied = $state(false);
  let picker;
  const fieldID = $props.id();
  const commands = `${INSTALL_COMMAND}\n${PREVIEW_COMMAND}`;
  let busy = $derived(disabled || isReading || isSubmitting);
  async function addFiles(files) {
    if (busy || !files.length) return;
    isReading = true; error = '';
    try { images = await readImageFiles(files, images); }
    catch (cause) { error = cause.message; }
    finally { isReading = false; if (picker) picker.value = ''; }
  }
  function paste(event) {
    if (!event.clipboardData?.files.length || usage !== USAGE.cloud) return;
    event.preventDefault(); void addFiles(event.clipboardData.files);
  }
  function drop(event) {
    event.preventDefault(); isDropping = false;
    if (usage === USAGE.cloud) void addFiles(event.dataTransfer.files);
  }
  async function start(event) {
    event.preventDefault();
    if (busy || !prompt.trim()) return;
    error = ''; isSubmitting = true;
    try {
      const name = mode === PROJECT_MODE.import ? repositoryLocator(repository).repo : prompt.trim().split(/\s+/).slice(0, 5).join(' ').slice(0, 100);
      await onstart({ name, prompt, images, ...(mode === PROJECT_MODE.import ? { repository } : { target }) });
    } catch (cause) { error = cause.message; }
    finally { isSubmitting = false; }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(commands); copied = true; }
    catch { error = 'Couldn’t copy. Select the commands to copy them manually.'; }
  }
</script>

<div class="prompt-surface nodrag nopan nowheel" role="region" aria-label="Project inputs and prompt" onpaste={paste} ondrop={drop} ondragover={(event) => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); isDropping = true; } }} ondragleave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) isDropping = false; }} data-umami-mask>
  <input class="image-picker" bind:this={picker} type="file" accept={IMAGE_MIMES.join(',')} multiple tabindex="-1" aria-label="Choose image inputs" onchange={(event) => void addFiles(event.currentTarget.files)} />
  <InputGraph {isWorking} bind:repository images={usage === USAGE.cloud ? images : []} isImport={usage === USAGE.cloud && mode === PROJECT_MODE.import} hasOutput={usage === USAGE.cloud && mode === PROJECT_MODE.new} disabled={busy} readonly={sourceLocked} onremove={(id) => images = images.filter((image) => image.image_id !== id)}>
    {#snippet children()}
      <div class="project-tab" data-graph-port={GRAPH_PORT.repository}><Icon name="grip" size={13} /><label class="sr-only" for={`${fieldID}-mode`}>Project source</label><select id={`${fieldID}-mode`} bind:value={mode} disabled={busy || sourceLocked}><option value={PROJECT_MODE.new}>New project</option><option value={PROJECT_MODE.import}>Import repository</option></select></div>
      <form class="canvas-composer" class:drop-active={isDropping} onsubmit={start}>
        {#if usage === USAGE.cloud}<label class="sr-only" for={`${fieldID}-prompt`}>Prompt</label><textarea id={`${fieldID}-prompt`} bind:value={prompt} rows="3" maxlength="20000" placeholder={mode === PROJECT_MODE.import ? 'What should we change?' : 'What do you want to build?'} disabled={busy} onkeydown={(event) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void start(event); }}></textarea>
        {:else}<div class="canvas-local"><p>Run Clank in your project folder.</p><pre><code>{commands}</code></pre><button type="button" class="text-button" onclick={copy}><Icon name={copied ? 'check' : 'copy'} size={14} />{copied ? 'Copied' : 'Copy commands'}</button></div>{/if}
        <div class="canvas-footer"><div>{#if usage === USAGE.cloud}<button type="button" class="attach-button" data-graph-port={GRAPH_PORT.attachment} onclick={() => picker.click()} disabled={busy} aria-label="Add image inputs" title="Add images, paste, or drop onto the prompt"><Icon name="plus" size={19} /></button>{/if}<label class="execution-menu"><Icon name={usage === USAGE.cloud ? 'cloud' : 'computer'} size={17} />{#if cloudOnly}<span>Cloud</span>{:else}<span class="sr-only">Where it runs</span><select bind:value={usage} disabled={busy}><option value={USAGE.cloud}>Cloud</option><option value={USAGE.local}>Local</option></select>{/if}</label></div>
          {#if usage === USAGE.cloud}<button class="send-button" data-graph-port={GRAPH_PORT.output} type="submit" disabled={busy || !prompt.trim()} aria-label={mode === PROJECT_MODE.import ? 'Start from repository' : 'Start building'}><Icon name="arrow" size={18} /></button>{/if}
        </div>
      </form>
    {/snippet}
    {#snippet output()}
      <label class="target-node"><Icon name={target} size={17} /><span class="sr-only">App type</span><select bind:value={target} disabled={busy || sourceLocked}><option value={BUILD_TARGET.web}>Web</option><option value={BUILD_TARGET.mobile}>Mobile</option></select></label>
    {/snippet}
  </InputGraph>
  {#if isReading}<p class="input-notice" role="status">Reading image inputs…</p>{/if}
  {#if error}<p class="input-error" role="alert">{error}</p>{/if}
</div>
