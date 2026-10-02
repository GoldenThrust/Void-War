
// // import { ctx } from "../core/canvas.ts";

// function circleCollision(a: ShipProp, b: ShipProp) {
//   const dx = a.x - b.x;
//   const dy = a.y - b.y;
//   const dist = dx * dx + dy * dy;
//   const sizeSq = a.r * a.r + b.r * b.r

//   return dist < sizeSq;
// }

// function boxCollision(a, b) {
//   return (
//     a.x < b.x + b.w &&
//     a.x + a.w > b.x &&
//     a.y < b.y + b.h &&
//     a.y + a.h > b.y
//   );
// }

// export function boxCircleCollision(box, circle) {
//   const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.w));
//   const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.h));

//   // ctx.fillStyle = "gold";
//   // ctx.beginPath();
//   // ctx.arc(closestX, closestY, 5, 0, Math.PI * 2)
//   // ctx.fill();

//   const dx = circle.x - closestX;
//   const dy = circle.y - closestY;

//   return (dx * dx + dy * dy) < (circle.r * circle.r);
// }

// export function checkCollision(a, b) {
//   if (a.shape === "box" && b.shape === "box") {
//     return boxCollision(a, b);
//   }

//   if (a.shape === "circle" && b.shape === "circle") {
//     return circleCollision(a, b);
//   }

//   if (a.shape === "box" && b.shape === "circle") {
//     return boxCircleCollision(a, b);
//   }

//   if (a.shape === "circle" && b.shape === "box") {
//     return boxCircleCollision(b, a);
//   }

//   return false;
// }


// function projectPolygon(axis, vertices) {
//   const projections = vertices.map(v => (v.x * axis.x + v.y * axis.y));
//   return {
//     min: Math.min(...projections),
//     max: Math.max(...projections)
//   };
// }

// function isSeparatingAxis(axis, vertices1, vertices2) {
//   const proj1 = projectPolygon(axis, vertices1);
//   const proj2 = projectPolygon(axis, vertices2);

//   return proj1.max < proj2.min || proj2.max < proj1.min;
// }

// function getEdges(vertices) {
//   let edges = [];
//   for (let i = 0; i < vertices.length; i++) {
//     const next = (i + 1) % vertices.length;
//     edges.push({
//       x: vertices[next].x - vertices[i].x,
//       y: vertices[next].y - vertices[i].y
//     });
//   }
//   return edges;
// }


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
      x: vertices[next].x - vertices[i].x,
      y: vertices[next].y - vertices[i].y
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

