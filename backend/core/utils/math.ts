const TAU = Math.PI * 2;


export function clamp(value: number, min: number, max?: number) {
  return Math.max(max ? min : -min, Math.min(max ?? min, value))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function normalizeAngle(angle: number) {
  return ((angle % TAU) + TAU) % TAU;
}

export function shortestAngleDist(a: number, b: number) {
  return ((b - a + Math.PI * 3) % TAU) - Math.PI;
}

export function clampAngle(angle: number, min: number, max: number) {
  angle = normalizeAngle(angle);
  min = normalizeAngle(min);
  max = normalizeAngle(max);

  const range = (max - min + TAU) % TAU;
  const relative = (angle - min + TAU) % TAU;

  // Inside range
  if (relative <= range) {
    return angle;
  }

  // Clamp to nearest edge
  const toMin = shortestAngleDist(angle, min);
  const toMax = shortestAngleDist(angle, max);

  return Math.abs(toMin) < Math.abs(toMax)
    ? min
    : max;
}