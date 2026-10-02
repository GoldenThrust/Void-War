function project(vertices: Vertices, axis: Vertice) {
  let min = Infinity;
  let max = -Infinity;

  for (const vertex of vertices) {
    const projection = vertex.x * axis.x + vertex.y * axis.y;

    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }

  return { min, max };
}

function getAxes(vertices: Vertices) {
  const axes = [];
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    const edge = {
      x: vertices[next]!.x - vertices[i]!.x,
      y: vertices[next]!.y - vertices[i]!.y
    };

    const length = Math.hypot(edge.x, edge.y);

    const normal = { x: -edge.y / length, y: edge.x / length };
    axes.push(normal);
  }
  return axes;
}

export function isSeperatingAxes(poly1: Vertices, poly2: Vertices) {
  let smallestOverlap = Infinity;
  let smallestAxis = null;

  const axes1 = getAxes(poly1);
  const axes2 = getAxes(poly2);

  for (const axis of [...axes1, ...axes2]) {
    const proj1 = project(poly1, axis);
    const proj2 = project(poly2, axis);
    if (proj1.max < proj2.min || proj2.max < proj1.min) {
      return {
        collision: false
      };
    }

    const overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);

    if (overlap < smallestOverlap) {
      smallestOverlap = overlap;
      smallestAxis = axis;
    }
  }

  return {
    collision: true,
    smallestOverlap,
    smallestAxis
  };
}

