import { BUILD_TARGET } from '../onboarding/preferences.js';
import { repositoryLocator, validateImages } from './image-inputs.js';
import { loadImages, storeImages } from './image-store.js';

export const DRAFT_KEY = 'clank:build-draft:v1';
export const BOARD_KEY = 'clank:board:v1:';
export const WORKSPACE_CONTEXT = Symbol('clank-workspace');
export const NODE_TYPE = Object.freeze({ project: 'project', draft: 'draft', note: 'note' });
export const SESSION_STATUS = Object.freeze({ busy: 'busy', idle: 'idle', error: 'error', dead: 'dead' });
export const PROJECT_MODE = Object.freeze({ new: 'new', import: 'import' });
const NODE_WIDTH = Object.freeze({ project: 1080, draft: 1100, narrow: 350, inputs: 268 });
const NODE_GAP = 100;

export function nodeWidth(node, isNarrow) {
  if (isNarrow) return NODE_WIDTH.narrow;
  if (node.type === NODE_TYPE.draft) return NODE_WIDTH.draft;
  if (node.type !== NODE_TYPE.project) throw new Error('Unknown board node type.');
  const hasInputs = node.data.inputs?.repository || node.data.inputs?.image_ids?.length;
  return NODE_WIDTH.project + (hasInputs ? NODE_WIDTH.inputs : 0);
}

export function nextNodePosition(nodes) {
  return { x: nodes.length ? Math.max(...nodes.map((node) => node.position.x + nodeWidth(node, false))) + NODE_GAP : 0, y: 0 };
}

export function newDraftNode(position, draft, autoStart) {
  if (![position?.x, position?.y].every(Number.isFinite)) throw new Error('A canvas position is required.');
  return { id: crypto.randomUUID(), type: NODE_TYPE.draft, dragHandle: '.node-handle', position: { ...position }, data: { draft, autoStart } };
}

export function validateDraft(value) {
  if (!value || typeof value.prompt !== 'string' || !value.prompt.trim() || value.prompt.length > 20000 ||
      typeof value.name !== 'string' || !value.name.trim() || value.name.length > 100) {
    throw new Error('Add a project name, describe your idea, and choose web or mobile.');
  }
  const draft = { prompt: value.prompt.trim(), name: value.name.trim() };
  if (value.repository !== undefined) {
    if (value.target !== undefined) throw new Error('An imported repository supplies its own app type.');
    const { owner, repo } = repositoryLocator(value.repository);
    draft.repository = `https://github.com/${owner}/${repo}`;
  } else {
    if (!Object.values(BUILD_TARGET).includes(value.target)) throw new Error('Choose web or mobile.');
    draft.target = value.target;
  }
  if (value.images !== undefined) draft.images = validateImages(value.images);
  if (value.project !== undefined) {
    if (typeof value.project?.worktree_id !== 'string' || !value.project.worktree_id) throw new Error('The saved project has no workspace identity.');
    draft.project = value.project;
  }
  return draft;
}

export function templateForTarget(templates, target) {
  const matches = templates.filter((item) => item.source === 'builtin' && item.build_target === target);
  if (matches.length !== 1 || !matches[0].clone_url) {
    throw new Error(`Your host must configure exactly one ${target} starter. Update its template catalog to build this app.`);
  }
  return matches[0];
}

export function applyAgentEvent(messages, event) {
  if (event.type === 'message') {
    const index = event.data.id ? messages.findIndex((item) => item.id === event.data.id) : -1;
    if (index < 0) return [...messages, event.data];
    return messages.map((item, i) => i === index ? { ...item, ...event.data } : item);
  }
  if (event.type !== 'part') return messages;
  const { message_id, part, is_delta } = event.data;
  if (!message_id || !part?.id) return messages;
  let index = messages.findIndex((item) => item.id === message_id);
  const result = [...messages];
  if (index < 0) {
    index = result.length;
    result.push({ id: message_id, role: 'assistant', content: '', parts: [] });
  }
  const current = result[index];
  const parts = [...(current.parts || [])];
  const partIndex = parts.findIndex((item) => item.id === part.id);
  if (partIndex < 0) parts.push(part);
  else parts[partIndex] = { ...parts[partIndex], ...part, text: is_delta ? (parts[partIndex].text || '') + (part.text || '') : part.text };
  result[index] = { ...current, parts };
  return result;
}

export function visibleMessages(messages, revertMessageID) {
  if (!revertMessageID) return messages;
  const index = messages.findIndex((item) => item.id === revertMessageID);
  return index < 0 ? messages : messages.slice(0, index);
}

export function projectNodes(sessions, saved) {
  return saved.flatMap((item) => {
    const session = sessions.find((session) => session.id === item.id && session.git_ref?.worktree_id);
    if (!session || !Number.isFinite(item.position?.x) || !Number.isFinite(item.position?.y)) return [];
    return [{ id: session.id, type: NODE_TYPE.project, dragHandle: '.node-handle', position: item.position, data: { session, ...(item.inputs ? { inputs: item.inputs } : {}) } }];
  });
}

export async function storeDraft(storage, value) {
  const draft = validateDraft(value);
  const { images, ...metadata } = draft;
  if (images !== undefined) {
    await storeImages(images);
    metadata.image_ids = images.map((image) => image.image_id);
  }
  storage.setItem(DRAFT_KEY, JSON.stringify(metadata));
}

export async function loadDraft(storage) {
  const stored = storage.getItem(DRAFT_KEY);
  if (!stored) return null;
  const parsed = JSON.parse(stored);
  if (parsed.image_ids !== undefined) {
    if (!Array.isArray(parsed.image_ids) || parsed.image_ids.some((id) => typeof id !== 'string' || !id)) throw new Error('The saved image references are invalid.');
    parsed.images = await loadImages(parsed.image_ids);
  }
  return validateDraft(parsed);
}

export function mergeBoardNodes(restored, current) {
  const currentIDs = new Set(current.map((node) => node.id));
  return [...restored.filter((node) => !currentIDs.has(node.id)), ...current];
}

export function reconcileHistory(snapshot, live, changedIDs) {
  const current = new Map(live.map((message) => [message.id, message]));
  const known = new Set(snapshot.map((message) => message.id));
  return [
    ...snapshot.map((message) => changedIDs.has(message.id) && current.has(message.id) ? current.get(message.id) : message),
    ...live.filter((message) => !known.has(message.id) && changedIDs.has(message.id))
  ];
}

export function parseBoard(raw) {
  const saved = JSON.parse(raw);
  if (!Array.isArray(saved?.nodes) || ![saved.viewport?.x, saved.viewport?.y, saved.viewport?.zoom].every(Number.isFinite) || saved.viewport.zoom < 0.25 || saved.viewport.zoom > 1.5) {
    throw new Error('The saved board layout is invalid.');
  }
  return saved;
}

export function transcriptMessages(messages) {
  const results = new Map();
  const callIDs = new Set();
  for (const message of messages) {
    for (const part of message.parts || []) {
      if (part.type === 'tool_result') results.set(part.id, part);
      if (part.type === 'tool_call') callIDs.add(part.id);
    }
  }
  return messages.flatMap((message) => {
    if (!message.parts?.length) return [message];
    const parts = message.parts.flatMap((part) => {
      if (part.type === 'tool_result' && callIDs.has(part.id)) return [];
      const result = part.type === 'tool_call' && results.get(part.id);
      return [result ? { ...part, output: result.output, status: result.status } : part];
    });
    if (!parts.length && !message.content) return [];
    const isToolOutput = !message.content && parts.length > 0 && parts.every((part) => part.type === 'tool_result');
    return [{ ...message, parts, role: isToolOutput ? 'tool' : message.role }];
  });
}
