<script>
  import { onMount, onDestroy } from 'svelte';
  import Icon from './Icon.svelte';
  import { inputConnection } from './image-inputs.js';
  import { GRAPH_PORT, graphPort } from './graph-ports.js';
  import { observeMotion } from './motion.js';
  import './prompt-canvas.css';
  let { repository = $bindable(''), images = [], isImport = false, readonly = false, disabled = false, onremove, children, output, hasOutput = false, isWorking = false } = $props();
  const fieldID = $props.id();
  let root;
  let paths = $state([]);
  let frame = $state({ width: 1, height: 1 });
  let observer;
  let animation;
  let canAnimate = $state(false);
  let hasInputs = $derived(isImport || images.length > 0);
  function measure() {
    if (!root) return;
    const box = root.getBoundingClientRect();
    const center = root.querySelector('.graph-center');
    const prompt = center?.getBoundingClientRect();
    if (!box.width || !prompt) return;
    const point = (rect, side) => ({ x: rect[side] - box.left, y: rect.top + rect.height / 2 - box.top });
    const port = (kind, side) => {
      const control = center.querySelector(`[data-graph-port="${kind}"]`);
      if (!control) throw new Error(`Missing graph port: ${kind}`);
      return graphPort(box, prompt, control.getBoundingClientRect(), side);
    };
    const next = Array.from(root.querySelectorAll('[data-input-node]')).map((node) => ({
      kind: node.dataset.inputNode,
      source: point(node.getBoundingClientRect(), 'right'), target: port(node.dataset.inputNode, 'left')
    }));
    const result = root.querySelector('.graph-output')?.getBoundingClientRect();
    if (result) next.push({ kind: GRAPH_PORT.output, source: port(GRAPH_PORT.output, 'right'), target: point(result, 'left') });
    frame = { width: box.width, height: box.height };
    paths = next;
  }
  onMount(() => {
    observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const child of root.children) observer.observe(child);
    measure();
    return observeMotion(root, (state) => { canAnimate = state.canAnimate; });
  });
  $effect(() => {
    repository; images; isImport; hasOutput;
    if (root) { cancelAnimationFrame(animation); animation = requestAnimationFrame(measure); }
  });
  onDestroy(() => { observer?.disconnect(); if (animation !== undefined) cancelAnimationFrame(animation); });
</script>

<div class="input-graph" class:has-inputs={hasInputs} class:has-output={hasOutput} class:flow-running={canAnimate} class:flow-working={isWorking} bind:this={root}>
  <svg class="input-connections" viewBox={`0 0 ${frame.width} ${frame.height}`} preserveAspectRatio="none" aria-hidden="true">
    {#each paths as path}
      <path d={inputConnection(path.source, path.target)} />
      {#if isWorking && path.kind === GRAPH_PORT.output}<circle class="flow-packet" r="2.5" style={`offset-path: path('${inputConnection(path.source, path.target)}')`} />{/if}
      <circle cx={path.source.x} cy={path.source.y} r="3" /><circle cx={path.target.x} cy={path.target.y} r="3" />
    {/each}
  </svg>
  {#if hasInputs}<div class="graph-inputs nodrag nopan nowheel" aria-label="Inputs">
    {#if isImport}<div class="repository-input" data-input-node={GRAPH_PORT.repository}>
      <Icon name="github" size={17} />
      {#if readonly}<span title={repository}>{repository.replace(/^https:\/\/github.com\//, '')}</span>
      {:else}<label class="sr-only" for={`${fieldID}-repo`}>GitHub repository URL</label><input id={`${fieldID}-repo`} aria-label="GitHub repository URL" bind:value={repository} placeholder="github.com/owner/repo" {disabled} autocomplete="off" spellcheck="false" />{/if}
    </div>{/if}
    {#each images as image (image.image_id)}<figure class="image-input" data-input-node={GRAPH_PORT.attachment}>
      <img src={image.source} alt={image.filename} width="208" height="116" />
      <figcaption><span title={image.filename}>{image.filename}</span>{#if onremove}<button type="button" class="icon-button" aria-label={`Remove ${image.filename}`} onclick={() => onremove(image.image_id)} {disabled}><Icon name="close" size={13} /></button>{/if}</figcaption>
    </figure>{/each}
  </div>{/if}
  <div class="graph-center">{@render children()}</div>
  {#if hasOutput && output}<div class="graph-output nodrag nopan nowheel">{@render output()}</div>{/if}
</div>
