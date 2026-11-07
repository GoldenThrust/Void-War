import { FIXED_DT } from "./utils/constants.ts";
import { spatial } from "./world/spatialHash.ts";
import { world } from "./world/world.ts";
import Asteroid from "./world/object/asteroid/asteroid.ts";
import PerkManager from "./perks/manager.ts";
import WeaponManager from "./weapons/manager.ts";
import ShipManager from "./player/ships/manager.ts";
import { clamp } from "./utils/math.ts";

let initPromise: Promise<void> | undefined;

export function init() {
  if (!initPromise) initPromise = initialize();
  return initPromise;
}

async function initialize() {
  Asteroid.init();
  ShipManager.init();
  PerkManager.spawn();
}

export function update(t: number, dt = FIXED_DT) {
  spatial.clear();
  spatial.insertAll(ShipManager.ships.values(), Asteroid.asteroids.values(), WeaponManager.weapons.values());

  world.update();
  WeaponManager.update(t, dt);
  ShipManager.update(t, dt);
  Asteroid.update();
  PerkManager.update(t);
}
let lastTime = performance.now();

export function step(t: number) {
  const elapsedSeconds = (t - lastTime) / 1000;
  lastTime = t;
  const dt = clamp(elapsedSeconds, 0, 1);
  let remaining = dt;
  const maxSteps = 8;
  let steps = 0;

  while (remaining >= FIXED_DT && steps < maxSteps) {
    update(t, FIXED_DT);
    remaining -= FIXED_DT;
    steps++;
  }
  
  if (steps === maxSteps) update(t, FIXED_DT);
  console.log(`Step: ${steps}, Remaining: ${remaining.toFixed(4)}s, Elapsed: ${elapsedSeconds.toFixed(4)}s FPS: ${(1 / elapsedSeconds).toFixed(2)}`);
}
