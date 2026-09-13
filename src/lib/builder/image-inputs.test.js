import { test, expect } from 'bun:test';
import { readImageFiles, validateImages, repositoryLocator, inputConnection, MAX_IMAGE_BYTES } from './image-inputs.js';

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

test('reactive image inputs cross the structured-clone boundary used by IndexedDB', async () => {
  const images = await readImageFiles([new File([png], 'reference.png', { type: 'image/png' })]);
  const reactive = new Proxy(images.map((image) => new Proxy(image, {})), {});
  expect(structuredClone(validateImages(reactive))).toEqual(images);
});

test('file selection and clipboard files retain the bytes accepted by the agent attachment contract', async () => {
  const file = new File([png], 'reference.png', { type: 'image/png' });
  const [image] = await readImageFiles([file]);
  expect(image.filename).toBe('reference.png');
  expect(image.mime).toBe('image/png');
  expect(new Uint8Array(await (await fetch(image.source)).arrayBuffer())).toEqual(png);
  expect(validateImages([image])).toEqual([image]);
});

test('invalid and oversized images fail before any inputs are accepted', async () => {
  await expect(readImageFiles([new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' })])).rejects.toThrow('PNG');
  await expect(readImageFiles([new File([], 'empty.png', { type: 'image/png' })])).rejects.toThrow('contain data');
  await expect(readImageFiles([new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'large.png', { type: 'image/png' })])).rejects.toThrow('5 MB');
  await expect(readImageFiles(Array(5).fill(new File([png], 'reference.png', { type: 'image/png' })))).rejects.toThrow('four');
});

test('persisted image inputs cannot become remote URLs or executable SVG', () => {
  expect(() => validateImages([{ image_id: '1', filename: 'bad', mime: 'image/png', source: 'https://example.com/image.png' }])).toThrow('invalid');
  expect(() => validateImages([{ image_id: '1', filename: 'bad.svg', mime: 'image/svg+xml', source: 'data:image/svg+xml;base64,PHN2Zy8+' }])).toThrow('PNG');
});

test('repository input maps only a GitHub repository root to the existing launch API', () => {
  expect(repositoryLocator(' https://github.com/supaclank/clank.git ')).toEqual({ owner: 'supaclank', repo: 'clank' });
  expect(repositoryLocator('github.com/supaclank/clank/')).toEqual({ owner: 'supaclank', repo: 'clank' });
  for (const url of ['https://evil.test/a/b', 'https://github.com/a/b/pull/1', 'https://user:secret@github.com/a/b', 'https://github.com/a/b?token=secret', 'github.com/../repo', '']) {
    expect(() => repositoryLocator(url)).toThrow();
  }
});

test('dotted connection geometry meets the measured input and prompt ports', () => {
  expect(inputConnection({ x: 220, y: 50 }, { x: 280, y: 120 })).toBe('M220 50 C250 50 250 120 280 120');
});
