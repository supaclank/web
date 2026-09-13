export const SESSION_VIEW = Object.freeze({ prompt: 'prompt', activity: 'activity', title: 'title', chat: 'chat' });
export const SESSION_VIEWS = Object.freeze([
  { id: SESSION_VIEW.prompt, label: 'Prompt + activity', description: 'Keep the request visible, with the latest agent update below.' },
  { id: SESSION_VIEW.activity, label: 'Activity first', description: 'Lead with the current work; keep the request as a quiet reference.' },
  { id: SESSION_VIEW.title, label: 'Session card', description: 'Just a session name and current action. The conversation lives in the sidebar.' },
  { id: SESSION_VIEW.chat, label: 'Mini chat', description: 'A compact conversation: your message, the latest reply, and the current action.' },
]);
