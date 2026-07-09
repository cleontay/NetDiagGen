const TYPE_SHAPES = {
  router: 'diamond',
  server: 'round-rectangle',
  workstation: 'ellipse',
  iot: 'triangle',
};

export function getNodeShape(type) {
  return TYPE_SHAPES[type] ?? 'hexagon';
}
