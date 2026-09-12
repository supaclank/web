export const GRAPH_PORT = Object.freeze({ repository: 'repository', attachment: 'attachment', output: 'output' });

export function graphPort(frame, boundary, control, side) {
  return { x: boundary[side] - frame.left, y: control.top + control.height / 2 - frame.top };
}
