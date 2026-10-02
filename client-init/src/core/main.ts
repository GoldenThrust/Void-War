import { world } from "./world/world.ts";
import "./weapons/manager.ts";

import PlayerShip from "./player/ships/player.ts";
import EnemyManager from "./player/ships/enemies/manager.ts";

import { buildAssets } from "./assets/main.ts";
// import { loadModel, runAI } from "./core/ai/init.js"

import AudioManager from "./assets/audio/manager.ts";

let initPromise: Promise<void> | undefined;

const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

const canvas = document.querySelector("#game-canvas") as HTMLCanvasElement;

const { width, height } = canvas.getBoundingClientRect();

canvas.width = width;
canvas.height = height;

const minimap = document.querySelector("#minimap") as HTMLCanvasElement;



const { width: mWidth, height: mHeight } = minimap.getBoundingClientRect();
minimap.width = mWidth;
minimap.height = mHeight;

const OffscreenCanvas = canvas.transferControlToOffscreen();
const OffscreenMinimap = minimap.transferControlToOffscreen();

export async function init() {
  if (!initPromise) {
    initPromise = buildAssets();

    await initPromise;

    worker.postMessage(
      {
        canvas: OffscreenCanvas,
        minimap: OffscreenMinimap,
      },
      [OffscreenCanvas, OffscreenMinimap],
    );
  }

  return initPromise;
}

export let attachWorld = -1;

if (AudioManager.ctx.state !== "running") {
  AudioManager.ctx.resume();
}

addEventListener(
  "click",
  async () => {
    if (AudioManager.ctx.state !== "running") {
      AudioManager.ctx.resume();
    }
  },
  {
    once: true,
  },
);

worker.onmessage = async (e) => {
  if (e.data.start) {
    console.log("Game Starting....");
    worker.postMessage({
      start: true,
    });
  }
};
