import { FIXED_DT } from "./utils/constants.ts";
import { spatial } from "./world/spatialHash.ts";
import { world } from "./world/world.ts";
import Asteroid from "./world/object/asteroid/asteroid.ts";
import PerkManager from "./perks/manager.ts";
import PlayerShip, { ship } from "./player/ships/player.ts";
import ShipManager from "./player/ships/manager.ts";
import Minature from "./weapons/minature.ts";
import WeaponManager from "./weapons/manager.ts";
import { clamp } from "./utils/math.ts";

let initPromise: Promise<void> | undefined;
export let gameType = "offline";

export function init(type: string) {
  if (!initPromise) initPromise = initialize(type);
  return initPromise;
}

async function initialize(type: string) {
  gameType = type;

  if (gameType !== "online") {
    Asteroid.init();
    ShipManager.init();
    PerkManager.spawn();
  }

  PlayerShip.spawn(world.x, world.y);
  world.attach(ship);
}

export function update(t: number, dt = FIXED_DT) {
  spatial.clear();
  spatial.insertAll(ShipManager.ships.values(), Asteroid.asteroids.values());

  for (const weapon of WeaponManager.weapons.values()) {
    if (!(weapon instanceof Minature)) spatial.insert(weapon);
  }

  world.update();
  WeaponManager.update(t, dt);
  ShipManager.update(t, dt);
  Asteroid.update();
  PerkManager.update(t);
}

export function step(t: number, elapsedSeconds: number) {
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
}
