import { plugin } from 'bun';
import { test, expect } from 'bun:test';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';

plugin({
  name: 'svelte-server-components',
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
      contents: compile(await Bun.file(path).text(), { filename: path, generate: 'server' }).js.code,
      loader: 'js',
    }));
  },
});

const { default: PreviewContent } = await import('./PreviewContent.svelte');
const previewURL = 'https://preview-test.supaclank.com/?sig=a%2Fb%2Bc&exp=1900000000';

function content(props) {
  return render(PreviewContent, { props: { previewURL: '', isStarting: false, logs: '', frameVersion: 0, ...props } }).body;
}

test('Expo previews show the phone handoff even when an older host advertises web support', () => {
  const html = content({ kind: 'expo', can_preview_web: true, previewURL });
  expect(html).not.toContain('<iframe');
  expect(html).toContain('Open in Clank');
  expect(html).toContain(`clank://preview?url=${encodeURIComponent(previewURL)}`);
  expect(html).toContain('data:image/svg+xml,');
  expect(html).toContain('Scan with Clank');
});

test('the app download is available while Expo starts, before a preview URL exists', () => {
  const html = content({ kind: 'expo', isStarting: true });
  expect(html).toContain('https://play.google.com/store/apps/details?id=com.supaclank.clank');
  expect(html).toContain('Android');
  expect(html).toContain('QR code will appear');
  expect(html).not.toContain('clank://');
  expect(html).not.toContain('<iframe');
});

test('web previews keep their isolated iframe and embed mode', () => {
  const html = content({ kind: 'web', previewURL });
  expect(html).toContain('<iframe');
  expect(html).toContain('__clank_embed=1');
  expect(html).toContain('referrerpolicy="no-referrer"');
  expect(html).not.toContain('clank://');
});

test('a pending preview never loads an iframe or QR code', () => {
  const html = content({ isStarting: true });
  expect(html).not.toContain('<iframe');
  expect(html).not.toContain('data:image/svg+xml,');
});
