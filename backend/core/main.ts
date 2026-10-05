import Asteroid from "./world/object/asteroid/asteroid.ts";
import ShipManager from "./ships/manager.ts";
import WeaponManager from "./weapons/manager.ts";
import Minature from "./weapons/minature.ts";
import { FIXED_DT } from "./utils/constants.ts";
import { spatial } from "./world/spatialHash.ts";
import PerkManager from "./perks/manager.ts";

let initialized = false;

export function initialize() {
  if (initialized) return;

  Asteroid.init();
  ShipManager.init();
  PerkManager.spawn();
  initialized = true;
}

export function step(t = performance.now(), dt = FIXED_DT) {
  initialize();

  spatial.clear();
  spatial.insertAll(ShipManager.ships.values(), Asteroid.asteroids.values());

  for (const weapon of WeaponManager.weapons.values()) {
    if (weapon instanceof Minature) continue;
    spatial.insert(weapon);
  }

  WeaponManager.update(t, dt);
  ShipManager.update(t, dt);
  for (const asteroid of Asteroid.asteroids.values()) {
    asteroid.update(dt);
  }
  PerkManager.update(t);
}

export function initSnapShot() {
  return {
    ships: Array.from(ShipManager.ships.values(), (ship) => ({
      id: ship.id,
      name: ship.name,
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      speed: ship.speed,
      life: ship.life,
      friend: ship.friend,
      vertices: ship.vertices,
      width: ship.width,
      height: ship.height,
      color: ship.color,
    })),
    weapons: Array.from(WeaponManager.weapons.values(), (weapon) => ({
      id: weapon.id,
      name: weapon.name,
      type: weapon.type,
      x: weapon.x,
      y: weapon.y,
      angle: weapon.angle,
      width: weapon.width,
      height: weapon.height,
      vertices: weapon.vertices,
      color: weapon.color,
      penetration: weapon.penetration,
      ship: weapon.ship.id,
      acceleration: weapon.acceleration,
      speed: weapon.speed,
      damage: weapon.damage,
      range: weapon.range,
      fireRate: weapon.fireRate,
      energyCost: weapon.energyCost,
    })),
    asteroids: Array.from(Asteroid.asteroids.values(), (asteroid) => ({
      id: asteroid.id,
      x: asteroid.x,
      y: asteroid.y,
      angle: asteroid.angle,
      vertices: asteroid.vertices,
      width: asteroid.width,
      height: asteroid.height,
      speed: asteroid.speed,
      rotationSpeed: asteroid.rotationSpeed,
    })),
    perks: Array.from(PerkManager.perks.values(), (perk) => ({
      id: perk.id,
      name: perk.name,
      x: perk.x,
      y: perk.y,
      angle: perk.angle,
      width: perk.width,
      height: perk.height,
      duration: perk.duration,
      color: perk.color,
      vertices: perk.vertices,
      collectedBy: perk.getShip()?.id ?? null,
    })),
    counts: {
      friendsAlive: ShipManager.friendsAlive,
      enemiesAlive: ShipManager.enemiesAlive,
    },
    time: performance.now(),
  };
}

export function updateSnapShot() {
  return {
    ships: Array.from(ShipManager.ships.values(), (ship) => ({
      id: ship.id,
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      life: ship.life,
    })),
    weapons: Array.from(WeaponManager.weapons.values(), (weapon) => ({
      id: weapon.id,
      name: weapon.name,
      type: weapon.type,
      x: weapon.x,
      y: weapon.y,
      angle: weapon.angle,
      ship: weapon.ship.id,
      width: weapon.width,
      height: weapon.height,
      acceleration: weapon.acceleration,
      speed: weapon.speed,
      damage: weapon.damage,
      range: weapon.range,
      fireRate: weapon.fireRate,
      energyCost: weapon.energyCost,
      penetration: weapon.penetration,
      distanceTraveled: weapon.distanceTraveled,
      active: weapon.active,
    })),
    asteroids: Array.from(Asteroid.asteroids.values(), (asteroid) => ({
      id: asteroid.id,
      x: asteroid.x,
      y: asteroid.y,
      angle: asteroid.angle,
    })),
    perks: Array.from(PerkManager.perks.values(), (perk) => ({
      id: perk.id,
      x: perk.x,
      y: perk.y,
      angle: perk.angle,
    })),
    counts: {
      friendsAlive: ShipManager.friendsAlive,
      enemiesAlive: ShipManager.enemiesAlive,
    },
    time: performance.now(),
  };
}