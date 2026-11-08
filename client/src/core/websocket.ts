import { io, Socket } from "socket.io-client";
import type Ship from "./player/ships/ship";
import ShipManager from "./player/ships/manager";
import Asteroid from "./world/object/asteroid/asteroid";
import WeaponManager from "./weapons/manager";
import PerkManager from "./perks/manager";
import { world } from "./world/world";

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

type AdditionalData = {
  friendsAlive: number;
  enemiesAlive: number;
  guerrilla: boolean;
  id: string;
};

export default class Websocket {
  public socket;
  static socket: Socket;

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
      ShipManager.ships.set(ShipManager.ship.id, ShipManager.ship);
    });

    this.socket.on("disconnect", () => {
      ShipManager.ships.clear();
    });

    this.socket.on("player:left", (id: string, additional: AdditionalData) => {
      ShipManager.ships.delete(id);
      ShipManager.friendsAlive = additional.friendsAlive;
      ShipManager.enemiesAlive = additional.enemiesAlive;
    });

    this.socket.on("player:joined", (ships: Ship) => {
      setPlayers([ships]);
    });

    this.socket.on(
      "players:init",
      (data: Ship[], additional: AdditionalData) => {
        ShipManager.ship.id = additional.id;
        ShipManager.ships.set(ShipManager.ship.id, ShipManager.ship);
        ShipManager.ship.friend = additional.guerrilla;
        ShipManager.friendsAlive = additional.friendsAlive;
        ShipManager.enemiesAlive = additional.enemiesAlive;
        setPlayers(data);
        console.log(`Player ID: ${ShipManager.ship.id}, Friend: ${ShipManager.ship.friend}, Friends Alive: ${ShipManager.friendsAlive}, Enemies Alive: ${ShipManager.enemiesAlive}`);
      },
    );

    this.socket.on("asteroids:init", (asteroids: Asteroid[]) => {
      setAsteroids(asteroids);
    });

    this.socket.on("world:init", (worldData) => {
      world.width = worldData.width;
      world.height = worldData.height;
    });

    this.socket.on("weapons:init", (weapons: any[]) => {
      setWeapons(weapons);
    });

    this.socket.on("perks:init", (perks: any[]) => {
      setPerks(perks);
    });

    this.socket.on("game:update", (snapshot) => {
      setPlayers(snapshot.ships);
      setAsteroids(snapshot.asteroids);
      setWeapons(snapshot.weapons);
      setPerks(snapshot.perks);
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
  }
}

function setAsteroids(asteroids: Asteroid[]) {
  const serverAsteroidIds = new Set(asteroids.map((asteroid) => asteroid.id));

  for (const id of Asteroid.asteroids.keys()) {
    if (!serverAsteroidIds.has(id)) Asteroid.asteroids.delete(id);
  }

  asteroids.forEach((asteroid) => {
    const existingAsteroid = Asteroid.asteroids.get(asteroid.id);
    if (existingAsteroid) {
      existingAsteroid.init(asteroid as any);
      return;
    }

    const newAsteroid = new Asteroid();
    newAsteroid.init(asteroid as any);
    Asteroid.asteroids.set(newAsteroid.id, newAsteroid);
  });
}

function setWeapons(weapons: any[]) {
  const serverWeaponIds = new Set(weapons.map((weapon) => weapon.id));

  for (const id of WeaponManager.weapons.keys()) {
    if (!serverWeaponIds.has(id)) WeaponManager.weapons.delete(id);
  }

  weapons.forEach((weapon) => {
    const weaponClass = WeaponManager.weaponsByName[weapon.name];
    if (!weaponClass) {
      console.warn(`Weapon type ${weapon.name} not found in WeaponManager`);
      return;
    }

    const weaponShip = ShipManager.ships.get(weapon.shipId);
    if (!weaponShip) {
      console.warn(
        `Ship with ID ${weapon.shipId} not found for weapon ${weapon.name}`,
      );
      return;
    }

    const existingWeapon = WeaponManager.weapons.get(weapon.id);
    if (existingWeapon && existingWeapon.name === weapon.name) {
      Object.assign(existingWeapon, weapon, { ship: weaponShip });
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
      ship: weaponShip,
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
    newWeapon.distanceTraveled = weapon.distanceTraveled;
    WeaponManager.weapons.set(newWeapon.id, newWeapon);
  });
}

function setPerks(perks: any[]) {
  const serverPerkIds = new Set(perks.map((perk) => perk.id));

  for (const id of PerkManager.perks.keys()) {
    if (!serverPerkIds.has(id)) PerkManager.perks.delete(id);
  }

  perks.forEach((perk) => {
    const perkClass = PerkManager.perkByName[perk.name];
    if (!perkClass) {
      console.warn(`Perk type ${perk.name} not found in PerkManager`);
      return;
    }

    const perkShip = perk.shipId
      ? ShipManager.ships.get(perk.shipId)
      : undefined;
    const existingPerk = PerkManager.perks.get(perk.id);
    if (existingPerk && existingPerk.name === perk.name) {
      Object.assign(existingPerk, perk);
      existingPerk.setShip = perkShip ?? null;
      return;
    }

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
    if (perkShip) newPerk.setShip = perkShip;
    PerkManager.perks.set(newPerk.id, newPerk);
  });
}

function setPlayers(ships: Ship[]) {
  const serverShipIds = new Set(ships.map((serverShip) => serverShip.id));

  for (const id of ShipManager.ships.keys()) {
    if (id !== ShipManager.ship.id && !serverShipIds.has(id)) {
      ShipManager.ships.delete(id);
    }
  }

  ships.forEach((s) => {
    const existingShip = ShipManager.ships.get(s.id);

    // if (ShipManager.ship.id === s.id) {
    //   console.log(`Updating local player ship with ID: ${ShipManager.ship.id}`);
    //   return;
    // }
    if (existingShip) {
      Object.assign(existingShip, s);
      return;
    }

    const shipClass = ShipManager.shipByName[s.name];
    if (!shipClass) {
      console.warn(`Ship type ${s.name} not found in ShipManager`);
      return;
    }
    const playerShip = new shipClass({
      x: s.x,
      y: s.y,
      angle: s.angle,
      acceleration: s.acceleration,
      width: s.width,
      height: s.height,
      color: s.color,
      vertices: s.vertices,
      friend: s.friend,
    });

    Object.assign(playerShip, s);

    ShipManager.ships.set(s.id, playerShip);
  });
}
