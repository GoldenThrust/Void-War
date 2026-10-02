
// import { spatial } from "../world/spatialHash.ts";
// import { toroidalDirection, toroidalDistance } from "../world/utils.ts";
// import Ship from "../player/ships/enemies/enemy.ts";
// import Ship from "../player/ships/ship.ts";

// function circleDistanceSq(a, b) {
//   const dx = a.x - b.x;
//   const dy = a.y - b.y;

//   return dx * dx + dy * dy;
// }

// function boxDistance(r1, r2) {
//   const dx = Math.max(
//     r1.x - (r2.x + r2.w),
//     r2.x - (r1.x + r1.w),
//     0
//   );

//   const dy = Math.max(
//     r1.y - (r2.y + r2.h),
//     r2.y - (r1.y + r1.h),
//     0
//   );

//   return dx * dx + dy * dy;
// }

// export function boxCircleDistance(box, circle) {
//   const cx = Math.max(box.x, Math.min(circle.x, box.x + box.w));
//   const cy = Math.max(box.y, Math.min(circle.y, box.y + box.h));

//   const dx = circle.x - cx;
//   const dy = circle.y - cy;

//   return dx * dx + dy * dy;
// }

// export function distance(a, b) {
//   if (a.shape === "box" && b.shape === "box") {
//     return boxDistance(a, b);
//   }

//   if (a.shape === "circle" && b.shape === "circle") {
//     return circleDistance(a, b);
//   }

//   if (a.shape === "box" && b.shape === "circle") {
//     return boxCircleDistance(a, b);
//   }

//   if (a.shape === "circle" && b.shape === "box") {
//     return boxCircleDistance(b, a);
//   }
// }

// // export function withinRange(a, b, dist) {
// //   return distance(a, b) < dist * dist;
// // }


// // export function nearByEnemy(self, callback = () => { }) {
// //   const object = spatial.query(sh.x, self.y, 1000);

// //   for (const ship of object) {
// //     if (ship instanceof Ship && ship !== self) {
// //       callback(ship);
// //     }
// //   }
// // }