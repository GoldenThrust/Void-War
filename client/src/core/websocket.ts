import { io } from "socket.io-client";
import type Ship from "./player/ships/ship";
import ShipManager from "./player/ships/manager";
import PlayerShip, { ship } from "./player/ships/player";
import Asteroid from "./world/object/asteroid/asteroid";
import WeaponManager from "./weapons/manager";
import PerkManager from "./perks/manager";

// function toroidalLerp(
//   current: number,
//   target: number,
//   t: number,
//   size: number,
// ) {
//   const clampedT = Math.max(0, Math.min(1, t));
//   let delta = target - current;
//   if (delta > size * 0.5) delta -= size;
//   if (delta < -size * 0.5) delta += size;

//   return (((current + delta * clampedT) % size) + size) % size;
// }

export default class Websocket {
  public socket;

  constructor(url: string) {
    this.socket = io(url, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.25,
    });

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      Asteroid.asteroids.clear();
      ShipManager.ships.clear();
      WeaponManager.weapons.clear();
      PerkManager.perks.clear();
      ShipManager.ships.set(ship.id, ship);
    });

    this.socket.on("disconnect", () => {
      ShipManager.ships.clear();
    });

    this.socket.on("player:left", (id: string) => {
      ShipManager.ships.delete(id);
    });

    this.socket.on("players:joined", (ships: Ship[]) => {
      ships.forEach((ship) => {
        const playerShip = new PlayerShip({
          x: ship.x,
          y: ship.y,
          angle: ship.angle,
          acceleration: ship.acceleration,
          width: ship.width,
          height: ship.height,
          color: ship.color,
          vertices: ship.vertices,
          friend: ship.friend,
        });

        playerShip.speed = ship.speed;
        ShipManager.ships.set(ship.id, playerShip);
      });
    });

    this.socket.on("asteroids:init", (asteroids: Asteroid[]) => {
      asteroids.forEach((asteroid) => {
        const newAsteroid = new Asteroid();
        newAsteroid.init(asteroid as any);

        Asteroid.asteroids.set(newAsteroid.id, newAsteroid);
      });
    });

    this.socket.on("weapons:init", (weapons: any[]) => {
      weapons.forEach((weapon) => {
        const weaponClass = WeaponManager.weaponsByName[weapon.name];
        if (!weaponClass) {
          console.warn(`Weapon type ${weapon.name} not found in WeaponManager`);
          return;
        }

        const ship = ShipManager.ships.get(weapon.shipId);
        if (!ship) {
          console.warn(
            `Ship with ID ${weapon.shipId} not found for weapon ${weapon.name}`,
          );
          return;
        }

        const newWeapon = new weaponClass({
          id: weapon.id,
          name: weapon.name,
          type: weapon.type,
          x: weapon.x,
          y: weapon.y,
          width: weapon.width,
          height: weapon.height,
          angle: weapon.angle,
          ship: ship,
          acceleration: weapon.acceleration,
          speed: weapon.speed,
          damage: weapon.damage,
          range: weapon.range,
          energyCost: weapon.energyCost,
          fireRate: weapon.fireRate,
          vertices: weapon.vertices,
          color: weapon.color,
          penetration: weapon.penetration,
        });

        newWeapon.speed = weapon.speed;
        newWeapon.acceleration = weapon.acceleration;

        WeaponManager.weapons.set(newWeapon.id, newWeapon);
      });
    });

    this.socket.on("perks:init", (perks: any[]) => {
      perks.forEach((perk) => {
        const perkClass = PerkManager.perkByName[perk.name];

        if (!perkClass) {
          console.warn(`Perk type ${perk.name} not found in PerkManager`);
          return;
        }

        const ship = ShipManager.ships.get(perk.shipId);

        const newPerk = new perkClass({
          id: perk.id,
          name: perk.name,
          x: perk.x,
          y: perk.y,
          angle: perk.angle,
          width: perk.width,
          height: perk.height,
          vertices: perk.vertices,
          duration: perk.duration,
          color: perk.color,
        });

        newPerk.startTime = perk.startTime;
        if (ship) newPerk.setShip = ship;

        PerkManager.perks.set(newPerk.id, newPerk);
      });
    });

    this.socket.on("game:update", (snapshot) => {
      // console.log(snapshot);
    });
    console.log("WebSocket initialized");
  }

  initPlayer(data: Ship) {
    this.socket.emit("player:init", {
      x: data.x,
      y: data.y,
      angle: data.angle,
      acceleration: data.acceleration,
      width: data.width,
      height: data.height,
      color: data.color,
    });

    console.log("Player initialized on server:", data);
  }
}
