import { test, expect } from 'bun:test';
import { readEventStream } from './event-stream.js';

test('SSE handles UTF-8 split across chunks, CRLF and comments', async () => {
  const bytes = new TextEncoder().encode(': ping\r\n\r\nevent: message\r\ndata: {"type":"message","data":{"content":"Hej 🌱"}}\r\n\r\ndata: {"type":"status"}\n\n');
  const stream = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close(); } });
  const events = [];
  await readEventStream(stream, (event) => events.push(event));
  expect(events).toEqual([{ type: 'message', data: { content: 'Hej 🌱' } }, { type: 'status' }]);
});
