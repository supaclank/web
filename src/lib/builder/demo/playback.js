import { DEMO_PHASE } from './model.js';
import { workStepAt } from './progress.js';

export const DEMO_PROMPT = 'Build a simple habit tracker. A weekly overview, streaks, and a little less noise.';
export const PLAYBACK = Object.freeze({ clickPrompt: 650, type: 900, typed: 3500, submit: 4200, editing: 5900, starting: 9500, ready: 11700, check: 12800, end: 13500 });
export const CURSOR_TARGET = Object.freeze({ entry: 'entry', prompt: 'prompt', submit: 'submit', preview: 'preview' });

export function playbackFrame(elapsed) {
  const phase = elapsed >= PLAYBACK.ready ? DEMO_PHASE.ready : elapsed >= PLAYBACK.starting ? DEMO_PHASE.starting : elapsed >= PLAYBACK.editing ? DEMO_PHASE.editing : elapsed >= PLAYBACK.submit ? DEMO_PHASE.reading : DEMO_PHASE.prompt;
  const typed = Math.max(0, Math.min(1, (elapsed - PLAYBACK.type) / (PLAYBACK.typed - PLAYBACK.type)));
  let from = CURSOR_TARGET.entry, to = CURSOR_TARGET.prompt, progress = Math.min(1, elapsed / PLAYBACK.clickPrompt);
  if (elapsed >= PLAYBACK.typed) { from = CURSOR_TARGET.prompt; to = CURSOR_TARGET.submit; progress = Math.min(1, (elapsed - PLAYBACK.typed) / 500); }
  if (elapsed >= PLAYBACK.ready) { from = CURSOR_TARGET.submit; to = CURSOR_TARGET.preview; progress = Math.min(1, (elapsed - PLAYBACK.ready) / 850); }
  const isClicking = [PLAYBACK.clickPrompt, PLAYBACK.submit, PLAYBACK.check].some((time) => elapsed >= time && elapsed < time + 220);
  return { phase, step: workStepAt(Math.max(0, elapsed - PLAYBACK.submit)), prompt: DEMO_PROMPT.slice(0, Math.floor(DEMO_PROMPT.length * typed)), from, to, progress, isClicking, isPreviewClicked: elapsed >= PLAYBACK.check, isComplete: elapsed >= PLAYBACK.end };
}

export function nextPlaybackStep(elapsed) {
  return [PLAYBACK.typed, PLAYBACK.submit, PLAYBACK.editing, PLAYBACK.starting, PLAYBACK.ready].find((time) => time > elapsed) ?? PLAYBACK.ready;
}
