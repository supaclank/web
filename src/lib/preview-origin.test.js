import { test, expect } from 'bun:test';
import { previewFrameSource, validatePreviewURL } from './preview-origin.js';

test('frame policy uses the configured preview domain and gateway scheme/port', () => {
  expect(previewFrameSource('https://api.example.com', 'preview.example.net')).toBe('https://*.preview.example.net');
  expect(previewFrameSource('http://supaclank.test:18080', 'supaclank.test')).toBe('http://*.supaclank.test:18080');
  for (const root of ['', '*', 'example.com/path', 'example.com:80', 'example..com']) expect(() => previewFrameSource('https://example.com', root)).toThrow();
});

test('preview frames reject same-origin app access, credentials and deceptive hosts', () => {
  const validate = (url) => validatePreviewURL(url, 'https://api.example.com', 'preview.example.net', 'https://example.com');
  expect(validate('https://preview-abc.preview.example.net/?sig=private')).toContain('sig=private');
  for (const url of ['https://example.com', 'javascript:alert(1)', 'https://preview-abc.preview.example.net.evil.com', 'https://user:pass@preview-abc.preview.example.net', 'http://preview-abc.preview.example.net']) expect(() => validate(url)).toThrow();
});
