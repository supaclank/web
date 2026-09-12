const MENU_MARGIN = 8;

export function contextMenuPosition(point, menu, viewport) {
  if (![point.x, point.y, menu.width, menu.height, viewport.width, viewport.height].every(Number.isFinite) || menu.width <= 0 || menu.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    throw new Error('Context menu coordinates and dimensions are required.');
  }
  return {
    x: Math.max(MENU_MARGIN, Math.min(point.x, viewport.width - menu.width - MENU_MARGIN)),
    y: Math.max(MENU_MARGIN, Math.min(point.y, viewport.height - menu.height - MENU_MARGIN)),
  };
}
