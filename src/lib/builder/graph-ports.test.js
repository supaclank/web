import { test, expect } from 'bun:test';
import { graphPort } from './graph-ports.js';
import { canRunMotion } from './motion.js';

test('edges meet the selected controls at the panel boundary rather than its midpoint', () => {
  const frame = { left: 80, top: 100 };
  const panel = { left: 340, right: 980 };
  const tab = { top: 110, height: 30 };
  const plus = { top: 258, height: 30 };
  expect(graphPort(frame, panel, tab, 'left')).toEqual({ x: 260, y: 25 });
  expect(graphPort(frame, panel, plus, 'left')).toEqual({ x: 260, y: 173 });
  expect(graphPort(frame, panel, plus, 'right')).toEqual({ x: 900, y: 173 });
});

test('nonessential edge motion stops offscreen, in hidden tabs, and for reduced motion', () => {
  const active = { isVisible: true, isDocumentVisible: true, isReduced: false };
  expect(canRunMotion(active)).toBe(true);
  expect(canRunMotion({ ...active, isVisible: false })).toBe(false);
  expect(canRunMotion({ ...active, isDocumentVisible: false })).toBe(false);
  expect(canRunMotion({ ...active, isReduced: true })).toBe(false);
});
