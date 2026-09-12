export const FOLLOW_TOLERANCE = 0.25;

export function cursorViewport(point, size, zoom) {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !(size.width > 0 && size.height > 0 && zoom > 0)) {
    throw new Error('Cursor position, canvas size and zoom are required.');
  }
  return { x: size.width / 2 - point.x * zoom, y: size.height / 2 - point.y * zoom, zoom };
}
