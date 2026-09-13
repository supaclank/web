import { test, expect } from 'bun:test';
import { workStep, workStepAt, WORK_STEPS, sessionTitle } from './progress.js';
import { DEMO_PHASE } from './model.js';

test('file edits accumulate over time before checks and preview startup', () => {
  expect(workStepAt(0)).toBe(0);
  expect(workStep(0).files).toHaveLength(0);
  expect(workStepAt(1700)).toBe(1);
  expect(workStep(1).files).toHaveLength(1);
  expect(workStep(2).files).toHaveLength(2);
  expect(workStep(3).files).toHaveLength(3);
  expect(workStep(1).files[0].added).toBeLessThan(workStep(3).files[0].added);
  expect(workStep(4).action).toContain('check');
  expect(workStep(5).action).toContain('preview');
  expect(workStepAt(7500)).toBe(WORK_STEPS.length - 1);
  expect(workStep(WORK_STEPS.length - 1).phase).toBe(DEMO_PHASE.ready);
  expect(() => workStep(-1)).toThrow();
});

test('session titles retain the identity of the user request', () => {
  expect(sessionTitle('  Build a weekly planner\nwith reminders ')).toBe('Build a weekly planner');
  expect(sessionTitle('')).toBe('New session');
});
