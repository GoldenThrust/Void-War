import { world } from "./world.ts";

export function wrap(value: number, size: number) {
  return ((value % size) + size) % size;
}

export function toroidalDelta(a: number, b: number, size: number) {
  let delta = (b - a) % size;
  if (delta > size * 0.5) delta -= size;
  if (delta < -size * 0.5) delta += size;
  return delta;
}

export function toroidalDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  space = world,
) {
  const dx = toroidalDelta(x1, x2, space.width);
  const dy = toroidalDelta(y1, y2, space.height);
  return dx * dx + dy * dy;
}

export function toroidalAngle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  space = world,
) {
  const dx = toroidalDelta(x1, x2, space.width);
  const dy = toroidalDelta(y1, y2, space.height);
  return Math.atan2(dy, dx);
}

export function toroidalDirection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angle: number,
  offset = 0,
) {
  const targetAngle = toroidalAngle(x1, y1, x2, y2, world);
  const difference = targetAngle + angle + offset;
  return Math.atan2(Math.sin(difference), Math.cos(difference));
}
