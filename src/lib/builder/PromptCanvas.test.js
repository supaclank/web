import { plugin } from 'bun';
import { test, expect } from 'bun:test';
import { compile, compileModule } from 'svelte/compiler';
import { render } from 'svelte/server';
import { sessionRequest } from './session-request.js';
import { readImageFiles } from './image-inputs.js';
import { projectNodes } from './model.js';

plugin({ name: 'prompt-server-components', setup(build) {
  build.onLoad({ filter: /\.svelte\.js$/ }, async ({ path }) => ({
    contents: compileModule(await Bun.file(path).text(), { filename: path, generate: 'server' }).js.code,
    loader: 'js',
  }));
  build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
    contents: compile(await Bun.file(path).text(), { filename: path, generate: 'server' }).js.code,
    loader: 'js',
  }));
} });
const { default: PromptCanvas } = await import('./PromptCanvas.svelte');

test('new projects offer a type while imported repositories provide their own source', () => {
  const fresh = render(PromptCanvas).body;
  expect(fresh).toContain('App type');
  expect(fresh).not.toContain('GitHub repository URL');
  const imported = render(PromptCanvas, { props: { initial: { repository: 'https://github.com/supaclank/clank' } } }).body;
  expect(imported).toContain('GitHub repository URL');
  expect(imported).not.toContain('App type');
  expect(imported).not.toContain('graph-output');
  expect(imported).toContain('What should we change?');
  expect(imported).toContain('data-graph-port="repository"');
  expect(imported).toContain('data-graph-port="attachment"');
  expect(fresh).toContain('data-graph-port="output"');
});

test('the landing keeps the real prompt separate from its clearly labelled scripted example', async () => {
  const { default: Landing } = await import('./Landing.svelte');
  const html = render(Landing).body;
  expect(html.replace(/<[^>]+>/g, '')).toContain('Build apps. Keep your code.');
  expect(html).toContain('Interactive demo');
  expect(html).toContain('This example is scripted');
  expect(html).toContain('Start building');
  expect(html).toContain('Loading the example workspace');
});

test('image inputs survive draft rendering and reach the session attachment contract', async () => {
  const images = await readImageFiles([new File(['image bytes'], 'reference.png', { type: 'image/png' })]);
  const draft = { repository: 'github.com/supaclank/clank', name: 'clank', prompt: 'Use this reference', images };
  const html = render(PromptCanvas, { props: { initial: draft, prompt: draft.prompt } }).body;
  expect(html).toContain(images[0].source);
  expect(html).toContain('Remove reference.png');
  const request = sessionRequest(draft, { worktree_id: 'worktree' }, 'opencode', { mode: 'build' });
  expect(request.attachments).toEqual(images);
  expect(request.git_ref).toEqual({ worktree_id: 'worktree', display_name: 'clank' });
  expect(request).not.toHaveProperty('target');
  expect(request).not.toHaveProperty('repository');
  expect(() => sessionRequest(draft, {}, 'opencode', {})).toThrow('workspace');
});

test('local instructions offer no cloud upload or starter controls', () => {
  const html = render(PromptCanvas, { props: { usage: 'local' } }).body;
  expect(html).toContain('Copy commands');
  expect(html).not.toContain('Add image inputs');
  expect(html).not.toContain('App type');
});

test('saved board nodes retain input references without embedding image bytes', () => {
  const session = { id: 'session', git_ref: { worktree_id: 'worktree' } };
  const inputs = { repository: 'https://github.com/supaclank/clank', image_ids: ['image-id'] };
  const nodes = projectNodes([session], [{ id: session.id, position: { x: 0, y: 0 }, inputs }]);
  expect(nodes[0].data.inputs).toEqual(inputs);
});

test('the demo mounts its real composer before the cursor has a canvas to measure', async () => {
  const { default: DemoBoard } = await import('./demo/DemoBoard.svelte');
  const { playbackFrame } = await import('./demo/playback.js');
  const frame = playbackFrame(0);
  const html = render(DemoBoard, { props: { phase: frame.phase, scriptedPrompt: frame.prompt, isScripted: true, canAnimate: true, cursor: frame, isPreviewClicked: false, oninteract() {}, onphase() {} } }).body;
  expect(html).toContain('Demo prompt');
  expect(html).toContain('Run demo');
  expect(html).not.toContain('class="demo-cursor');
  expect(html).toContain('aria-label="Chat with Clank"');
  expect(html).toContain('aria-expanded="false"');
});
