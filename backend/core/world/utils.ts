
import { world } from "./world.ts";

type World = { x: number; y: number; width: number; height: number; }
export function wrap(value: number, size: number) {
    return ((value % size) + size) % size;
}

export function toroidalDelta(a: number, b: number, size: number) {
    let d = (b - a) % size;
    if (d > size * 0.5) d -= size;

    if (d < -size * 0.5) d += size;

    return d;
}

export function toroidalDistance(x1: number, y1: number, x2: number, y2: number, space = world) {
    const dx = toroidalDelta(x1, x2, space.width);
    const dy = toroidalDelta(y1, y2, space.height);

    return dx * dx + dy * dy;
}

export function toroidalAngle(x1: number, y1: number, x2: number, y2: number, space = world) {
    const dx = toroidalDelta(x1, x2, space.width);
    const dy = toroidalDelta(y1, y2, space.height);

    return Math.atan2(dy, dx);
}

export function toroidalDirection(x1: number, y1: number, x2: number, y2: number, angle: number, offset = 0) {
    const targetAngle = toroidalAngle(x1, y1, x2, y2, world);

    let diff = (targetAngle + angle) + offset;

    diff = Math.atan2(Math.sin(diff), Math.cos(diff));

    return diff;
}

export function worldToScreen(wx: number, wy: number, space: World = world) {
    const dx = toroidalDelta(space.x, wx, space.width);
    const dy = toroidalDelta(space.y, wy, space.height);

    return {
        x: dx + space.width / 2,
        y: dy + space.height / 2
    }
}

