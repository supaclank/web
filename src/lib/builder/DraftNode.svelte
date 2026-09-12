<script>
  import { getContext, untrack } from 'svelte';
  import { WORKSPACE_CONTEXT, DRAFT_KEY, validateDraft, templateForTarget, storeDraft } from './model.js';
  import { repositoryLocator } from './image-inputs.js';
  import { sessionRequest } from './session-request.js';
  import { FREE_AI_CHOICE } from '../free-ai.js';
  import { defaultPresetFor } from '../pull-request-preview.js';
  import AgentProviderConnect from '../pull-request/AgentProviderConnect.svelte';
  import GitHubConnect from '../pull-request/GitHubConnect.svelte';
  import AuthPanel from './AuthPanel.svelte';
  import PromptCanvas from './PromptCanvas.svelte';
  import Icon from './Icon.svelte';
  let { id, data } = $props();
  const workspace = getContext(WORKSPACE_CONTEXT);
  let draft = $state(untrack(() => data.draft));
  let prompt = $state(untrack(() => data.draft?.prompt || ''));
  let provider = $state(FREE_AI_CHOICE);
  let providers = $state([]);
  let isChoosingProvider = $state(false);
  let needsGitHub = $state(false);
  let isBusy = $state(false);
  let detail = $state('');
  let error = $state('');
  let project = $state(untrack(() => data.draft?.project || null));
  let didAutoStart = false;
  $effect(() => {
    if (workspace.gateway && data.autoStart && !didAutoStart) { didAutoStart = true; void build(draft); }
  });
  async function chooseProvider() {
    error = '';
    try { providers = await workspace.gateway.providers(); isChoosingProvider = true; }
    catch (cause) { error = cause.message; }
  }
  async function build(value) {
    if (isBusy) return;
    isBusy = true; error = ''; needsGitHub = false;
    try {
      draft = validateDraft(value);
      await storeDraft(localStorage, { ...draft, ...(project ? { project } : {}) });
      detail = 'Waking your private cloud machine…';
      const presets = await workspace.gateway.presets(provider.backend);
      const preset = defaultPresetFor(presets, provider.backend);
      if (!project) {
        if (draft.repository) {
          detail = 'Opening your repository…';
          project = await workspace.gateway.launchRepository(repositoryLocator(draft.repository));
        } else {
          detail = `Creating your ${draft.target === 'web' ? 'website' : 'mobile app'}…`;
          const template = templateForTarget(await workspace.gateway.templates(), draft.target);
          project = await workspace.gateway.createProject(template.clone_url, draft.name);
        }
        if (!project.worktree_id) { project = null; throw new Error('The host created a project without its workspace identity.'); }
      }
      await storeDraft(localStorage, { ...draft, project });
      detail = 'Opening your agent conversation…';
      const sessions = await workspace.gateway.sessions();
      let session = sessions.find((item) => item.git_ref?.worktree_id === project.worktree_id && item.prompt === draft.prompt);
      if (!session) session = await workspace.gateway.createSession(sessionRequest(draft, project, provider.backend, preset.config));
      localStorage.removeItem(DRAFT_KEY);
      workspace.created(id, session, { repository: draft.repository, image_ids: (draft.images || []).map((image) => image.image_id) });
    } catch (cause) {
      needsGitHub = ['github_connection_required', 'github_token_invalid', 'github_forbidden'].includes(cause.code);
      error = cause.status === 402 ? 'Your cloud trial or subscription needs attention. Open Account to continue.' : cause.message;
    } finally { isBusy = false; }
  }
</script>
<section class="draft-workspace" aria-label="New project">
  <header class="node-handle"><span><Icon name="plus" size={17} />New conversation</span><Icon name="grip" size={15} /></header>
  <div class="draft-scroll nodrag nopan nowheel">
  <PromptCanvas isWorking={isBusy} initial={draft} bind:prompt onstart={build} disabled={isBusy || !workspace.user} sourceLocked={!!project} cloudOnly />
  <div class="draft-details">
    {#if !workspace.user}<AuthPanel />
    {:else if isBusy}<p class="input-notice" role="status">{detail}</p>
    {:else if isChoosingProvider}<div class="nodrag nopan nowheel provider-picker"><AgentProviderConnect gateway={workspace.gateway} {providers} onconnected={(choice) => { provider = choice; isChoosingProvider = false; }} /><button class="text-button" onclick={() => isChoosingProvider = false}>Back to your idea</button></div>
    {:else}<div class="model-choice nodrag nopan"><span>{provider === FREE_AI_CHOICE ? 'Free AI · OpenCode' : provider.display_name}</span><button type="button" class="text-button" onclick={chooseProvider}>Change provider</button></div>{#if provider === FREE_AI_CHOICE}<p class="small-note">Free AI is rate-limited. Connect your own provider for more choice.</p>{/if}{/if}
    {#if needsGitHub}<div class="nodrag nopan nowheel"><GitHubConnect gateway={workspace.gateway} onconnected={() => void build(draft)} /></div>{/if}
    {#if error}<div class="node-error nodrag nopan" role="alert"><p>{error}</p><a href="/welcome?return_to=%2F%3Fbuild%3D1">Account</a></div>{/if}
  </div>
  </div>
</section>
