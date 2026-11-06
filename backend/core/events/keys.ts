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

// addEventListener("devicemotion", ({ rotationRate }) => {
//     console.log("Device motion event:", rotationRate);
//     const { alpha, beta, gamma } = rotationRate as DeviceMotionEventRotationRate;
//     orientation["alpha"] = (alpha as number)/360;
//     orientation["beta"] = (beta as number)/360;
//     orientation["gamma"] = (gamma as number)/360;

//     console.log("Device orientation:", orientation, rotationRate);
// })

addEventListener("deviceorientation", ({ alpha, beta, gamma }) => {
    orientation["alpha"] = (alpha as number)/360;
    orientation["beta"] = (beta as number)/360;
    orientation["gamma"] = (gamma as number)/360;
    console.log(orientation["gamma"]);
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
