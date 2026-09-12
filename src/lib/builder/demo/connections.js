export function connectionReleasePoint(event) {
  const pointer = 'changedTouches' in event ? event.changedTouches[0] : event;
  return { x: pointer.clientX, y: pointer.clientY };
}
