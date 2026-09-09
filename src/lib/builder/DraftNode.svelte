<script>
  import { getContext, untrack } from 'svelte';
  import { WORKSPACE_CONTEXT, DRAFT_KEY, validateDraft, templateForTarget, storeDraft } from './model.js';
  import { FREE_AI_CHOICE } from '../free-ai.js';
  import { defaultPresetFor } from '../pull-request-preview.js';
  import AgentProviderConnect from '../pull-request/AgentProviderConnect.svelte';
  import AuthPanel from './AuthPanel.svelte';
  import Icon from './Icon.svelte';
  let { id, data } = $props();
  const workspace = getContext(WORKSPACE_CONTEXT);
  let name = $state(untrack(() => data.draft?.name || 'My new project'));
  let prompt = $state(untrack(() => data.draft?.prompt || ''));
  let target = $state(untrack(() => data.draft?.target || 'web'));
  let provider = $state(FREE_AI_CHOICE);
  let providers = $state([]);
  let isChoosingProvider = $state(false);
  let isBusy = $state(false);
  let detail = $state('');
  let error = $state('');
  let project = $state(untrack(() => data.draft?.project || null));
  let didAutoStart = false;
  $effect(() => {
    if (workspace.gateway && data.autoStart && !didAutoStart) { didAutoStart = true; void build(); }
  });
  async function chooseProvider() {
    error = '';
    try { providers = await workspace.gateway.providers(); isChoosingProvider = true; }
    catch (cause) { error = cause.message; }
  }
  async function build(event) {
    event?.preventDefault();
    if (isBusy) return;
    isBusy = true; error = '';
    try {
      const draft = validateDraft({ name, prompt, target });
      if (!project) storeDraft(localStorage, draft);
      detail = 'Waking your private cloud machine…';
      const [templates, presets] = await Promise.all([workspace.gateway.templates(), workspace.gateway.presets(provider.backend)]);
      const template = templateForTarget(templates, target);
      const preset = defaultPresetFor(presets, provider.backend);
      if (!project) {
        detail = `Creating your ${target === 'web' ? 'website' : 'mobile app'}…`;
        project = await workspace.gateway.createProject(template.clone_url, draft.name);
        if (!project.worktree_id) throw new Error('The host created a project without its workspace identity.');
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, project })); }
        catch { error = 'Keep this tab open while your project starts. Browser storage is unavailable.'; }
      }
      detail = 'Opening your agent conversation…';
      const sessions = await workspace.gateway.sessions();
      let session = sessions.find((item) => item.git_ref?.worktree_id === project.worktree_id && item.prompt === draft.prompt);
      if (!session) session = await workspace.gateway.createSession({ backend: provider.backend, hostname: 'local', git_ref: { worktree_id: project.worktree_id, display_name: draft.name }, prompt: draft.prompt, config: preset.config });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* The server session remains the source of truth. */ }
      workspace.created(id, session);
    } catch (cause) { error = cause.status === 402 ? 'Your cloud trial or subscription needs attention. Open Account to continue.' : cause.message; }
    finally { isBusy = false; }
  }
</script>
<section class="draft-node" aria-label="New project">
  <header class="node-handle"><span><Icon name="plus" size={17} />A new beginning</span><Icon name="grip" size={15} /></header>
  {#if !workspace.user}{#if prompt}<div class="saved-idea"><span>Your {target === 'web' ? 'website' : 'mobile app'} idea</span><p>{prompt}</p></div>{/if}<AuthPanel />
  {:else if isBusy}<div class="build-progress" role="status"><img src="/mascot.png" alt="" width="42" height="42" /><h2>{name}</h2><p>{detail}</p><span class="progress-line"></span></div>
  {:else if isChoosingProvider}<div class="nodrag nopan nowheel provider-picker"><AgentProviderConnect gateway={workspace.gateway} {providers} onconnected={(choice) => { provider = choice; isChoosingProvider = false; }} /><button class="text-button" onclick={() => isChoosingProvider = false}>Back to your idea</button></div>
  {:else}<form class="new-project-form nodrag nopan nowheel" onsubmit={build} data-umami-mask>
    <h2>What are we making?</h2><label>Project name<input bind:value={name} maxlength="100" required disabled={!!project} /></label>
    <fieldset class="target-tabs"><legend class="sr-only">App type</legend>{#each ['web', 'mobile'] as value}<label class:chosen={target === value}><input type="radio" name={`target-${id}`} value={value} bind:group={target} disabled={!!project} /><Icon name={value} size={17} />{value === 'web' ? 'Website' : 'Mobile app'}</label>{/each}</fieldset>
    <label class="sr-only" for={`prompt-${id}`}>Describe your app</label><textarea id={`prompt-${id}`} bind:value={prompt} rows="5" maxlength="20000" placeholder="Describe your idea…" required></textarea>
    <div class="model-choice"><span>{provider === FREE_AI_CHOICE ? 'Free AI · OpenCode' : provider.display_name}</span><button type="button" class="text-button" onclick={chooseProvider}>Change</button></div>
    {#if provider === FREE_AI_CHOICE}<p class="small-note">Free AI is rate-limited and may give lower-quality results. Connect your own provider for more choice.</p>{/if}
    <button class="primary-button" disabled={!prompt.trim()}>{project ? 'Continue building' : 'Start building'}<Icon name="arrow" size={18} /></button>
  </form>{/if}
  {#if error}<div class="node-error" role="alert"><p>{error}</p><a href="/welcome?return_to=%2F%3Fbuild%3D1">Account</a></div>{/if}
</section>
