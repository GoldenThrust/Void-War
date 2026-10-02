import { keybinds } from "./keybind.ts";

export const keys: Record<string, boolean> = {};
export const orientation: Record<string, number> = {};
export const touchDetected: Record<string, boolean> = {};

addEventListener("keydown", (e) => {
    keys[e.key] = true;
    keybinds[e.key]?.(e);
})

addEventListener("keyup", ({ key }) => {
    keys[key] = false;
})

addEventListener("devicemotion", ({ rotationRate }) => {
    const { alpha, beta, gamma } = rotationRate as DeviceMotionEventRotationRate;
    orientation["alpha"] = alpha as number;
    orientation["beta"] = beta as number;
    orientation["gamma"] = gamma as number;
})


addEventListener('mousedown', () => {
    touchDetected["mouse"] = true;
})

addEventListener('mouseup', () => {
    touchDetected["mouse"] = false;
})

addEventListener("touchstart", () => {
    touchDetected["touch"] = true;
})
addEventListener("touchend", () => {
    touchDetected["touch"] = false;
})
