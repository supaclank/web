import { validateDraft } from './model.js';

export function sessionRequest(value, project, backend, config) {
  const draft = validateDraft(value);
  if (!project?.worktree_id || !backend || !config) throw new Error('A workspace, agent and build configuration are required.');
  return {
    backend,
    hostname: 'local',
    git_ref: { worktree_id: project.worktree_id, display_name: draft.name },
    prompt: draft.prompt,
    config,
    ...(draft.images?.length ? { attachments: draft.images } : {}),
  };
}
