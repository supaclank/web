import { test, expect } from 'bun:test';
import { ClankGateway } from '../clank-gateway.js';
import { defaultPresetFor, pollUntil } from '../pull-request-preview.js';
import { templateForTarget } from './model.js';

const url = process.env.CLANK_BUILDER_TEST_URL;
const token = process.env.CLANK_BUILDER_TEST_TOKEN;
const sessionID = process.env.CLANK_BUILDER_TEST_SESSION_ID;

test.skipIf(!url)('real host streams a board conversation and serves its private embedded preview', async () => {
  if (!token || !sessionID) throw new Error('The integration gateway token and disposable session ID are required.');
  const gateway = new ClankGateway(url, token);
  const templates = await gateway.templates();
  expect(templateForTarget(templates, 'web').clone_url).toContain('svelte-starter-template');
  expect(templateForTarget(templates, 'mobile').clone_url).toContain('expo-56-starter-template');
  const session = await gateway.session(sessionID);
  expect(defaultPresetFor(await gateway.presets(session.backend), session.backend).config).toBeDefined();
  expect(await gateway.permissions(sessionID)).toEqual([]);
  const controller = new AbortController();
  const events = [];
  const stream = gateway.sessionEvents(sessionID, (event) => events.push(event), controller.signal).catch((error) => { if (!controller.signal.aborted) throw error; });
  try {
    await gateway.sendSessionMessage(sessionID, 'Reply exactly BOARD_READY. Do not edit files or run tools.');
    await pollUntil(() => gateway.session(sessionID), (value) => value.status === 'idle', { timeoutMs: 120000 });
    const messages = await gateway.messages(sessionID);
    expect(messages.some((message) => message.role === 'assistant' && message.content.includes('BOARD_READY'))).toBe(true);
    expect(events.some((event) => event.type === 'message' || event.type === 'part')).toBe(true);
  } finally { controller.abort(); await stream; }
  const initial = await gateway.previewStart(session.git_ref.worktree_id);
  const status = await pollUntil(() => gateway.previewStatus(session.git_ref.worktree_id, initial.service_name), (value) => value.state === 'ready', { timeoutMs: 60000 });
  expect(status.kind).toBe('web');
  const signed = await gateway.signPreviewToken(status.token, session.backend, sessionID);
  const preview = new URL(signed.signed_url);
  preview.searchParams.set('__clank_embed', '1');
  const response = await fetch(preview);
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html.toLowerCase()).toContain('<!doctype html>');
  expect(html).not.toContain('/__clank/overlay.js');
  expect(response.headers.getSetCookie().some((cookie) => cookie.includes('HttpOnly'))).toBe(true);
}, 180000);
