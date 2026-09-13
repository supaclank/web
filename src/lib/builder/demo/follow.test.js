import { test, expect } from 'bun:test';
import { cursorViewport } from './follow.js';

test('following centers a world position inside the canvas at the current zoom', () => {
  const point = { x: 1060, y: 305 };
  for (const width of [356, 818, 1130]) {
    for (const zoom of [0.4, 0.92, 1.4]) {
      const view = cursorViewport(point, { width, height: 414 }, zoom);
      expect(point.x * view.zoom + view.x).toBeCloseTo(width / 2);
      expect(point.y * view.zoom + view.y).toBeCloseTo(207);
      expect(view.zoom).toBe(zoom);
    }
  }
});

test('following requires a measured position and canvas', () => {
  expect(() => cursorViewport({ x: NaN, y: 0 }, { width: 800, height: 414 }, 1)).toThrow();
  expect(() => cursorViewport({ x: 0, y: 0 }, { width: 0, height: 414 }, 1)).toThrow();
  expect(() => cursorViewport({ x: 0, y: 0 }, { width: 800, height: 414 }, 0)).toThrow();
});
