import { BUILD_TARGET } from '../onboarding/preferences.js';

export const DRAFT_KEY = 'clank:build-draft:v1';
export const BOARD_KEY = 'clank:board:v1:';
export const WORKSPACE_CONTEXT = Symbol('clank-workspace');
export const NODE_TYPE = Object.freeze({ project: 'project', draft: 'draft', note: 'note' });
export const SESSION_STATUS = Object.freeze({ busy: 'busy', idle: 'idle', error: 'error', dead: 'dead' });

export function validateDraft(value) {
  if (!value || typeof value.prompt !== 'string' || !value.prompt.trim() || value.prompt.length > 20000 ||
      !Object.values(BUILD_TARGET).includes(value.target) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 100) {
    throw new Error('Add a project name, describe your idea, and choose web or mobile.');
  }
  return { prompt: value.prompt.trim(), target: value.target, name: value.name.trim() };
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
    return [{ id: session.id, type: NODE_TYPE.project, dragHandle: '.node-handle', position: item.position, data: { session } }];
  });
}

export function storeDraft(storage, draft) {
  storage.setItem(DRAFT_KEY, JSON.stringify(validateDraft(draft)));
}

export function loadDraft(storage) {
  const stored = storage.getItem(DRAFT_KEY);
  if (!stored) return null;
  const parsed = JSON.parse(stored);
  const draft = validateDraft(parsed);
  if (parsed.project) {
    if (typeof parsed.project.worktree_id !== 'string' || !parsed.project.worktree_id) throw new Error('The saved project has no workspace identity.');
    return { ...draft, project: parsed.project };
  }
  return draft;
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
