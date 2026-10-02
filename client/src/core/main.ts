import { world } from "./world/world.ts";
import WeaponManager from "./weapons/manager.ts";

import { destroyedShips } from "./player/ships/ship.ts";
import { stars } from "./world/object/star.ts";
import { minimap } from "./world/minimap.ts";
import Asteroid from "./world/object/asteroid/asteroid.ts";
import { clamp } from "./utils/math.ts";
import { explosions } from "./player/prop/explosion.ts";

import PlayerShip, { ship } from "./player/ships/player.ts";
import ShipManager from "./player/ships/manager.ts";

import { spatial } from "./world/spatialHash.ts";
import Minature from "./weapons/minature.ts";
import { assets, buildAssets } from "./assets/main.ts";
import { FIXED_DT } from "./utils/constants.ts";
// import AudioManager from "./assets/audio/manager.ts";
// import { applyAIResults } from "./ai/init.ts";
import { canvas, ctx } from "./world/canvas.ts";
import { websocket } from "./websocket.ts";
import PerkManager from "./perks/manager.ts";

let initPromise: Promise<void> | undefined;
export let gameType = "offline";

export function init(gameType: string) {
  if (!initPromise) {
    initPromise = initialize(gameType);
  }

  return initPromise;
}

async function initialize(type: string) {
  gameType = type;
  await buildAssets();

  console.log("Assets loaded", assets);
  await import("./world/manager.js");

  if (gameType !== "online") {
    Asteroid.init();
    ShipManager.init();
    PerkManager.spawn();
  } else {
    websocket.init();
  }
  PlayerShip.spawn(world.x, world.y);

  world.attach(ship);

  console.log((ShipManager.friendsAlive > 0 && ShipManager.enemiesAlive > 0 && gameType !== "online") || gameType === "online")
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
    spatial.insertAll(ShipManager.ships.values(), Asteroid.asteroids.values());

    for (const weapon of WeaponManager.weapons.values()) {
      if (weapon instanceof Minature) continue;
      spatial.insert(weapon);
    }

    world.update();

    WeaponManager.update(t, FIXED_DT);
    if (gameType !== "online") {
      ShipManager.update(t, FIXED_DT);
      // ship.update(t, FIXED_DT);
      // AudioManager.update(ship.x, ship.y, ship.angle);

      Asteroid.update();
      PerkManager.update(t);
    } else {
      ship.update(t, FIXED_DT);
    }

    timeAccumulator -= FIXED_DT;
  }

  // console.log("Out loop");

  world.render();

  for (const star of stars) {
    star.render();
  }

  WeaponManager.render();

  // ship.render();
  ShipManager.render();

  PerkManager.render();

  Asteroid.render();

  for (const exp of explosions) {
    exp.render();
  }

  minimap.render();
  // spatial.renderSpatialDebug();
  // spatial.renderCellRadius(ship.x, ship.y, 600);

  // static canvas object
  ctx.resetTransform();
  ctx.font = "20px monospace";
  ctx.fillStyle = "white";
  ctx.fillText(
    `Friend Alive: ${ShipManager.friendsAlive} Enemy Alive: ${ShipManager.enemiesAlive} - Destroyed: ${destroyedShips.length} Kill: ${ship.killScore} Weapon name: ${ship.weapon.name} heat: ${ship.heatPercent} x: ${Math.floor(ship.x)}y: ${Math.floor(ship.y)} speed: ${Math.floor(ship.speed)} max speed: ${Math.floor(ship.maxSpeed)} scales (World: ${world.scale} MiniMap: ${minimap.scale})`,
    10,
    20,
  );
  ctx.fillStyle = "white";
  ctx.fillText(
    `Life ${ship.life}`,
    10,
    50,
  );

  if ((ShipManager.friendsAlive > 0 && ShipManager.enemiesAlive > 0 && gameType !== "online") || gameType === "online")
    requestAnimationFrame(animate);
  else {
    const text =
      ship.life <= 0 ? "Game Over 😭. Try again." : "You dominate the void 🥳.";

    ctx.font = "50px Arial";

    const { width } = ctx.measureText(text);
    ctx.fillText(text, (canvas.width - width) / 2, canvas.height / 2);
  }
}

// if (AudioManager.ctx.state !== "running") {
//   AudioManager.ctx.resume();
// }
addEventListener(
  "click",
  async () => {
    // if (AudioManager.ctx.state !== "running") {
    //   AudioManager.ctx.resume();
    // }
  },
  {
    once: true,
  },
);
