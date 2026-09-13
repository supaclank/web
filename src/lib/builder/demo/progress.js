import { DEMO_PHASE } from './model.js';

export const WORK_STAGE = Object.freeze({ read: 0, habits: 1, week: 2, state: 3, check: 4, preview: 5, done: 6 });
const file = (name, added, removed) => ({ name, added, removed });
const habit = file('HabitList.svelte', 42, 8);
const week = file('WeekView.svelte', 28, 3);
const state = file('habits.ts', 19, 5);
export const WORK_STEPS = Object.freeze([
  { phase: DEMO_PHASE.reading, duration: 1700, action: 'Read project structure', text: 'Looking through the app and its existing components.', files: [] },
  { phase: DEMO_PHASE.editing, duration: 1200, action: 'Edit HabitList.svelte', text: 'Adding the habit list and completion controls.', files: [file('HabitList.svelte', 14, 2)] },
  { phase: DEMO_PHASE.editing, duration: 1200, action: 'Edit WeekView.svelte', text: 'Connecting the weekly view to completed habits.', files: [habit, file('WeekView.svelte', 12, 1)] },
  { phase: DEMO_PHASE.editing, duration: 1200, action: 'Edit habits.ts', text: 'Wiring up habit state and daily streaks.', files: [habit, week, state] },
  { phase: DEMO_PHASE.starting, duration: 900, action: 'Run bun check', text: 'Checking the components and TypeScript types.', files: [habit, week, state] },
  { phase: DEMO_PHASE.starting, duration: 1300, action: 'Start web preview', text: 'Checks passed. Opening the app preview.', files: [habit, week, state] },
  { phase: DEMO_PHASE.ready, duration: 0, action: 'Checks passed', text: 'The habit list, weekly view, and streaks are connected. Preview is running.', files: [habit, week, state] },
]);
export const LAST_WORK_STEP = WORK_STEPS.length - 1;
export function workStep(index) {
  if (!Number.isInteger(index) || !WORK_STEPS[index]) throw new Error('Unknown demo work step.');
  return WORK_STEPS[index];
}
export function workStepAt(elapsed) {
  let boundary = 0;
  for (let index = 0; index < LAST_WORK_STEP; index += 1) {
    boundary += WORK_STEPS[index].duration;
    if (elapsed < boundary) return index;
  }
  return LAST_WORK_STEP;
}
export function sessionTitle(prompt) {
  const line = prompt.trim().split('\n')[0];
  return line ? line.replace(/[.!?]$/, '') : 'New session';
}
