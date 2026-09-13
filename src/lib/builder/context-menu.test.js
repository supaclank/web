import { test, expect } from 'bun:test';
import { contextMenuPosition } from './context-menu.js';
import { newDraftNode } from './model.js';

test('a context menu stays inside the viewport without moving its canvas creation point', () => {
  const point = { x: 387, y: 841 };
  expect(contextMenuPosition(point, { width: 184, height: 46 }, { width: 390, height: 844 })).toEqual({ x: 198, y: 790 });
  expect(point).toEqual({ x: 387, y: 841 });
  expect(contextMenuPosition({ x: 50, y: 100 }, { width: 184, height: 46 }, { width: 1440, height: 1000 })).toEqual({ x: 50, y: 100 });
  expect(contextMenuPosition({ x: -20, y: -10 }, { width: 184, height: 46 }, { width: 390, height: 844 })).toEqual({ x: 8, y: 8 });
  expect(() => contextMenuPosition(point, { width: 0, height: 0 }, { width: 390, height: 844 })).toThrow();
});

test('each new session has its own draft and exact canvas position', () => {
  const first = newDraftNode({ x: -210, y: 345 }, null, false);
  const second = newDraftNode({ x: 420, y: -50 }, null, false);
  expect(first.id).not.toBe(second.id);
  expect(first.position).toEqual({ x: -210, y: 345 });
  expect(second.position).toEqual({ x: 420, y: -50 });
  expect(first.type).toBe('draft');
  expect(first.data).toEqual({ draft: null, autoStart: false });
  const draft = { prompt: 'A garden planner' };
  expect(newDraftNode({ x: 0, y: 0 }, draft, true).data).toEqual({ draft, autoStart: true });
  expect(() => newDraftNode({ x: NaN, y: 0 }, null, false)).toThrow();
});

test('canvas keyboard entry and its menu compile without accessibility warnings', async () => {
  const { compile } = await import('svelte/compiler');
  for (const file of ['CanvasMenu.svelte', 'Board.svelte', 'demo/DemoBoard.svelte']) {
    const filename = new URL(file, import.meta.url).pathname;
    const result = compile(await Bun.file(filename).text(), { filename });
    expect(result.warnings.filter((warning) => warning.code.startsWith('a11y_')).map((warning) => warning.code)).toEqual([]);
  }
});
