import { test, expect } from 'bun:test';
import { connectionReleasePoint } from './connections.js';

test('touch connections use the released finger position for canvas hit testing', () => {
  expect(connectionReleasePoint({ changedTouches: [{ clientX: 340, clientY: 280 }] })).toEqual({ x: 340, y: 280 });
});

test('mouse connections use the release position for the same canvas hit test', () => {
  expect(connectionReleasePoint({ clientX: 150, clientY: 220 })).toEqual({ x: 150, y: 220 });
});
