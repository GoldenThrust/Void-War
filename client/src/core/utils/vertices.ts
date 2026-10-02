import { ctx } from "../world/canvas.ts";
import { worldToScreen } from "../world/utils.ts";

export function drawVertices(vertices: Vertices, color = "blue") {
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.fillStyle = color;
  // ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.moveTo(vertices[0].x, vertices[0].y);

  vertices.forEach((vertex, i) => {
    if (i) {
      ctx.lineTo(vertex.x, vertex.y);
    }
  });

  ctx.lineTo(vertices[0].x, vertices[0].y);
  ctx.fill();
  // ctx.stroke();
  ctx.restore();
}

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

export function createVerticesPath(vertices: Vertices) {
  const verticesPath = new Path2D();

  verticesPath.moveTo(vertices[0].x, vertices[0].y);

  vertices.forEach((vertex, i) => {
    if (i) {
      verticesPath.lineTo(vertex.x, vertex.y);
    }
  });

  verticesPath.lineTo(vertices[0].x, vertices[0].y);

  return verticesPath;
}

export function drawVerticesPath(path: Path2D, color = "blue", fill = true) {
  ctx.save();
  ctx.lineWidth = 1.25;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  if (fill) {
    ctx.globalAlpha = 0.2;
    ctx.fill(path);
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.9;
  ctx.stroke(path);

  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.5;
  ctx.stroke(path);
  ctx.restore();
}

export function getVertices(
  vertices: Vertices,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
) {
  const world = worldToScreen(x, y);
  const transformedVertices = tranformVertices(
    vertices,
    world.x,
    world.y,
    width,
    height,
    angle,
  );

  return transformedVertices;
}
