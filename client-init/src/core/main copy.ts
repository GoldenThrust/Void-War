import { world } from "./world/world.ts";
import WeaponManager from "./weapons/manager.ts";

import { destroyedShips } from "./player/ships/ship.ts";
import { stars } from "./world/object/star.ts";
import { canvas, ctx } from "./world/canvas.ts";
import { minimap } from "./world/minimap.ts";
import { asteroids } from "./world/object/asteroid/asteroid.ts";
import { clamp } from "./utils/math.ts";
import { explosions } from "./player/prop/explosion.ts";

import PlayerShip from "./player/ships/player.ts";
import EnemyManager from "./player/ships/enemies/manager.ts";

import { spatial } from "./world/spatialHash.ts";
import Minature from "./weapons/minature.ts";
import { assets, buildAssets } from "./assets/main.ts";
// import { loadModel, runAI } from "./core/ai/init.js"
import { FIXED_DT } from "./utils/constants.ts";
import AudioManager from "./assets/audio/manager.ts";
import { applyAIResults } from "./ai/init.ts";

let initPromise: Promise<void> | undefined;

export function init() {
  if (!initPromise) {
    initPromise = initialize();
  }

  return initPromise;
}

async function initialize() {
  // loadModel();
  await buildAssets();

  console.log("Assets loaded", assets);
  await import("./world/manager.js");

  PlayerShip.spawn(world.x, world.y);
  EnemyManager.init();

  world.attach(PlayerShip.ship);
  requestAnimationFrame(animate);
}

export let attachWorld = -1;
let lastTime = performance.now();
let timeAccumulator = 0;

async function animate(t: number) {
  const deltaTime = clamp((t - lastTime) / 1000, 0, 1);
  lastTime = t;

  timeAccumulator += deltaTime;
  // console.log("Loop started");

  while (timeAccumulator >= FIXED_DT) {
    // console.log("In loop");
    spatial.clear();
    spatial.insertAll([PlayerShip.ship], EnemyManager.ships, asteroids);

    for (const weapon of WeaponManager.weapons) {
      if (weapon instanceof Minature) continue;
      spatial.insert(weapon);
    }

    world.update();

    // applyAIResults();

    WeaponManager.update(t, FIXED_DT);
    EnemyManager.update(t, FIXED_DT);
    PlayerShip.ship.update(t, FIXED_DT);
    AudioManager.update(PlayerShip.ship.x, PlayerShip.ship.y, PlayerShip.ship.angle);
    // runAI(t, FIXED_DT);

    for (const asteroid of asteroids) {
      asteroid.update(FIXED_DT);
    }

    timeAccumulator -= FIXED_DT;
  }

  // console.log("Out loop");

  world.render();

  for (const star of stars) {
    star.render();
  }

  WeaponManager.render();

  PlayerShip.ship.render();
  EnemyManager.render();

  for (const asteroid of asteroids) {
    asteroid.render();
  }

  for (const exp of explosions) {
    exp.render();
  }

  minimap.render();
  // spatial.renderSpatialDebug();

  // static canvas object
  ctx.resetTransform();
  ctx.font = "20px monospace";
  ctx.fillStyle = "white";
  ctx.fillText(
    `Ships Alive: ${EnemyManager.ships.length} - Destroyed: ${destroyedShips.length} Kill: ${PlayerShip.ship.killScore} Weapon name: ${PlayerShip.ship.weapon.name} heat: ${PlayerShip.ship.heatPercent} x: ${Math.floor(PlayerShip.ship.x)}y: ${Math.floor(PlayerShip.ship.y)} scales (World: ${world.scale} MiniMap: ${minimap.scale})`,
    10,
    20,
  );

  if (PlayerShip.ship.life > 0 && EnemyManager.ships.length > 0)
    requestAnimationFrame(animate);
  else {
    const text =
      PlayerShip.ship.life <= 0 ? "Game Over 😭. Try again." : "You dominate the void 🥳.";

    ctx.font = "50px Arial";

    const { width } = ctx.measureText(text);
    ctx.fillText(text, (canvas.width - width) / 2, canvas.height / 2);
  }
}

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
