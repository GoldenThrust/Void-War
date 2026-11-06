import { world } from "./world/world.ts";
import WeaponManager from "./weapons/manager.ts";

import Asteroid from "./world/object/asteroid/asteroid.ts";
import { clamp } from "./utils/math.ts";

import PlayerShip, { ship } from "./player/ships/player.ts";
import ShipManager from "./player/ships/manager.ts";

import { spatial } from "./world/spatialHash.ts";
import Minature from "./weapons/minature.ts";
import { FIXED_DT } from "./utils/constants.ts";

import PerkManager from "./perks/manager.ts";

let initPromise: Promise<void> | undefined;

export function init() {
  if (!initPromise) {
    initPromise = initialize();
  }

  return initPromise;
}

async function initialize() {
  await import("./world/manager.js");

  Asteroid.init();
  ShipManager.init();
  PerkManager.spawn();
  PlayerShip.spawn(world.x, world.y);

  world.attach(ship);
}

export let attachWorld = -1;
let lastTime = performance.now();
let timeAccumulator = 0;

export async function animate(t: number) {
  const deltaTime = clamp((t - lastTime) / 1000, 0, 1);

  const dt = t - lastTime;
  const fps = 1000 / dt;

  lastTime = t;

  timeAccumulator += deltaTime;
  let simulationSteps = 0;
  const maxSimulationSteps = 8;
  while (timeAccumulator >= FIXED_DT && simulationSteps < maxSimulationSteps) {
    spatial.clear();
    spatial.insertAll(ShipManager.ships.values(), Asteroid.asteroids.values());

    for (const weapon of WeaponManager.weapons.values()) {
      if (weapon instanceof Minature) continue;
      spatial.insert(weapon);
    }

    world.update();
    WeaponManager.update(t, FIXED_DT);
    ShipManager.update(t, FIXED_DT);

    Asteroid.update();
    PerkManager.update(t);

    timeAccumulator -= FIXED_DT;
    simulationSteps++;
  }

  if (simulationSteps === maxSimulationSteps) timeAccumulator = 0;

  console.log(
    `FPS: ${fps.toFixed(1)} | Simulation Steps: ${simulationSteps} | Time Accumulator: ${timeAccumulator.toFixed(3)}`,
  );
}
