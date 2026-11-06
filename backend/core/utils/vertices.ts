export function tranformVertices(
  vertices: Vertices,
  cx: number,
  cy: number,
  scaleX: number,
  scaleY: number,
  rotation: number,
) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const hw = scaleX / 2;
  const hh = scaleY / 2;

  const result = [];

  for (const vertex of vertices) {
    const sx = vertex.x * hw;
    const sy = vertex.y * hh;

    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;

    result.push({
      x: cx + rx,
      y: cy + ry,
    });
  }

  return result;
}
