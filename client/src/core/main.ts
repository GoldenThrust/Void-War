import { world } from "./world/world.ts";
import WeaponManager from "./weapons/manager.ts";

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
import PerkManager from "./perks/manager.ts";
import Websocket from "./websocket.ts";

let initPromise: Promise<void> | undefined;
export let gameType = "offline";
const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

let websocket: Websocket | undefined;
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
    websocket = new Websocket(backendUrl);

    websocket.init();
  }
  PlayerShip.spawn(world.x, world.y);

  world.attach(ship);

  console.log(
    (ShipManager.friendsAlive > 0 &&
      ShipManager.enemiesAlive > 0 &&
      gameType !== "online") ||
      gameType === "online",
  );
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

  let simulationSteps = 0;
  const maxSimulationSteps = 8;
  while (timeAccumulator >= FIXED_DT && simulationSteps < maxSimulationSteps) {
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
      websocket?.update();
    }

    timeAccumulator -= FIXED_DT;
    simulationSteps++;
  }

  // Avoid a catch-up spiral after a slow frame or a blocked browser tab.
  if (simulationSteps === maxSimulationSteps) timeAccumulator = 0;

  // console.log("Out loop");

  world.render();

  for (const star of stars) {
    star.render();
  }

  WeaponManager.render();

  PerkManager.render();
  // ship.render();
  ShipManager.render();

  Asteroid.render();

  for (const exp of explosions) {
    exp.render();
  }

  minimap.render();
  // spatial.renderSpatialDebug();
  // spatial.renderCellRadius(ship.x, ship.y, 600);

  // ctx.resetTransform();
  

  if (
    (ShipManager.friendsAlive > 0 &&
      ShipManager.enemiesAlive > 0 &&
      gameType !== "online") ||
    gameType === "online"
  )
    requestAnimationFrame(animate);
  else {
    const won = ship.life > 0;
    const title = won ? "SECTOR SECURED" : "SIGNAL LOST";
    const subtitle = won
      ? "The void is clear. Return to command."
      : "Your vessel was lost beyond the belt.";
    const panelWidth = Math.min(canvas.width * 0.72, 560);
    const panelHeight = 150;
    const panelX = (canvas.width - panelWidth) / 2;
    const panelY = (canvas.height - panelHeight) / 2;

    ctx.resetTransform();
    ctx.fillStyle = "rgba(3, 8, 13, 0.9)";
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = won
      ? "rgba(210, 255, 82, 0.7)"
      : "rgba(255, 82, 107, 0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    ctx.fillStyle = won ? "#d2ff52" : "#ff526b";
    ctx.fillRect(panelX, panelY, 5, panelHeight);
    ctx.textAlign = "center";
    ctx.font = "700 28px monospace";
    ctx.fillText(title, canvas.width / 2, panelY + 65);
    ctx.fillStyle = "#9eaaa9";
    ctx.font = "14px monospace";
    ctx.fillText(subtitle, canvas.width / 2, panelY + 100);
    ctx.textAlign = "start";
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
