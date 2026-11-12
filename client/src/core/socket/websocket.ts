import { io, Socket } from "socket.io-client";
import type Ship from "../player/ships/ship";
import ShipManager from "../player/ships/manager";
import Asteroid from "../world/object/asteroid/asteroid";
import WeaponManager from "../weapons/manager";
import PerkManager from "../perks/manager";
import { world } from "../world/world";


type AdditionalData = {
  friendsAlive: number;
  enemiesAlive: number;
  guerrilla: boolean;
  id: string;
  t?: number;
};

type Frame = {
  t: number;
  ships: any[];
  asteroids: any[];
  weapons: any[];
  perks: any[];
};

type Spawn = {
  t: number;
  asteroids?: any[];
  weapons?: any[];
  perks?: any[];
};

const localNow = () => performance.timeOrigin + performance.now();

/* ------------------------------ frame stats ------------------------------ */

/** Real client-side arrival rate (local clock deltas), smoothed. */
const stats = {
  lastArrival: 0,
  arrivalHz: 0,
  lastLog: 0,
};

function trackFrame(frame: Frame) {
  const now = localNow();
  let dt = 0;
  if (stats.lastArrival) {
    dt = now - stats.lastArrival;
    if (dt > 0) {
      const instantaneous = 1000 / dt;
      // Exponential moving average: instantaneous 1/dt is very noisy.
      // stats.arrivalHz = instantaneous;
      stats.arrivalHz = stats.arrivalHz
        ? stats.arrivalHz * 0.9 + instantaneous * 0.1
        : instantaneous;
    }
  }
  stats.lastArrival = now;


  // Log once per second instead of on every frame.
  if (now - stats.lastLog >= 1000) {
    stats.lastLog = now;
    // console.log(
    //   `Snapshots received: ${stats.arrivalHz.toFixed(1)}/s | ` +
    //     `Latency (approx, needs synced clocks): ${(now - frame.t).toFixed(1)} ms`,
    // );
  }

  return { dt, stats };
}

export default class Websocket {
  public socket;
  static socket: Socket;
  static serverTime = localNow();
  static localTime = localNow();
  static renderTime() {
    return (
      Websocket.serverTime + (localNow() - Websocket.localTime) - 1000 / 30
    );
  }

  constructor(url: string) {
    this.socket = io(url, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.25,
    });

    // FIX: the keybinds use the static socket, which was never assigned,
    // so every `Websocket.socket?.emit(...)` was silently skipped.
    Websocket.socket = this.socket;

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

    this.socket.on("player:joined", (ship: Ship, t: number) => {
      Websocket.serverTime = t;
      upsertShip(ship);
    });

    this.socket.on(
      "players:init",
      (data: Ship[], additional: AdditionalData) => {
        ShipManager.ship.id = additional.id;
        ShipManager.ships.set(additional.id, ShipManager.ship);
        ShipManager.ship.friend = additional.guerrilla;
        ShipManager.friendsAlive = additional.friendsAlive;
        ShipManager.enemiesAlive = additional.enemiesAlive;
        setPlayers(data);
        console.log(
          `Player ID: ${ShipManager.ship.id}, Friend: ${ShipManager.ship.friend}, Friends Alive: ${ShipManager.friendsAlive}, Enemies Alive: ${ShipManager.enemiesAlive}`,
        );
      },
    );

    this.socket.on("world:init", (worldData) => {
      world.reSize(worldData.width, worldData.height);
    });

    this.socket.on("asteroids:init", (asteroids: any[]) => {
      setAsteroids(asteroids);
    });

    this.socket.on("weapons:init", (weapons: any[]) => {
      setWeapons(weapons);
    });

    this.socket.on("perks:init", (perks: any[]) => {
      setPerks(perks);
    });

    // Reliable, sent once per new entity (static data: vertices, size, colour, ...).
    this.socket.on("entities:spawn", (spawn: Spawn) => {
      spawnAsteroids(spawn.asteroids ?? []);
      spawnWeapons(spawn.weapons ?? []);
      spawnPerks(spawn.perks ?? []);
    });

    // Volatile, small, frequent (dynamic data only).
    this.socket.on("game:update", (frame: Frame) => {
      // FIX: measure real arrival rate with local clock deltas (the old
      // "Local FPS" subtracted two server timestamps, so it just echoed the
      // server's rate), smoothed and logged once per second.
      const { dt } = trackFrame(frame);

      updatePlayers(frame.ships, frame.t);
      updateAsteroids(frame.asteroids, frame.t);
      updateWeapons(frame.weapons, frame.t);
      updatePerks(frame.perks, frame.t);
      Websocket.serverTime = frame.t;
      Websocket.localTime = localNow();
      // console.log(dt/100, FIXED_DT)
      world.update(dt/1000);
      ShipManager.socketUpdate();
      // world.update(FIXED_DT);
    });

    this.socket.on("ship:destroyed", (id) => {
      const ship = ShipManager.ships.get(id);

      if (!ship) {
        console.warn(`[Ship:destroyed]: Ship with ID ${id} not found`);
        return;
      }

      ship.destroy();
    });
    this.socket.on("weapon:destroyed", (id) => {
      const weapon = WeaponManager.weapons.get(id);

      if (!weapon) {
        console.warn(`[Weapon:destroyed]: Weapon with ID ${id} not found`);
        return;
      }

      WeaponManager.destroy(weapon);
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

function pruneMissing<V>(
  map: Map<any, V>,
  serverIds: Set<unknown>,
  keepId?: unknown,
) {
  for (const id of map.keys()) {
    if (id !== keepId && !serverIds.has(id)) map.delete(id);
  }
}

/* ------------------------------- ships ---------------------------------- */

function upsertShip(s: any) {
  const existing = ShipManager.ships.get(s.id);
  if (existing) {
    existing.updateFromServer(s, Websocket.serverTime);
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

  playerShip.updateFromServer(s, Websocket.serverTime);
  const weapon = WeaponManager.weaponsByName[s.weaponName];
  if (weapon) playerShip.weapon = weapon;
  ShipManager.ships.set(s.id, playerShip);
}

/** Full state (players:init): replace the roster. */
function setPlayers(ships: any[]) {
  pruneMissing(
    ShipManager.ships,
    new Set(ships.map((s) => s.id)),
    ShipManager.ship.id,
  );
  ships.forEach((s) => upsertShip(s));
}

/** Dynamic state (game:update): never creates, never snaps transforms. */
function updatePlayers(ships: any[], t: number) {
  pruneMissing(
    ShipManager.ships,
    new Set(ships.map((s) => s.id)),
    ShipManager.ship.id,
  );

  for (const s of ships) {
    const existing = ShipManager.ships.get(s.id);
    if (!existing) continue;

    // The server is authoritative, so the local ship is overwritten too.
    // If you add client-side prediction later, skip or reconcile
    // `ShipManager.ship.id` here instead of assigning x / y / angle.
    existing.updateFromServer(s, t);
    const weapon = WeaponManager.weaponsByName[s.weaponName];
    if (weapon) existing.weapon = weapon;
  }
}

/* ------------------------------ asteroids ------------------------------- */

function createAsteroid(a: any) {
  const asteroid = new Asteroid();
  asteroid.init(a as any, Websocket.serverTime);
  Asteroid.asteroids.set(asteroid.id, asteroid);
}

function setAsteroids(asteroids: any[]) {
  pruneMissing(Asteroid.asteroids, new Set(asteroids.map((a) => a.id)));

  for (const a of asteroids) {
    const existing = Asteroid.asteroids.get(a.id);
    if (existing) {
      existing.init(a as any, Websocket.serverTime);
    } else {
      createAsteroid(a);
    }
  }
}

function spawnAsteroids(asteroids: any[]) {
  for (const a of asteroids) {
    if (!Asteroid.asteroids.has(a.id)) createAsteroid(a);
  }
}

function updateAsteroids(asteroids: any[], t = Websocket.serverTime) {
  pruneMissing(Asteroid.asteroids, new Set(asteroids.map((a) => a.id)));

  for (const a of asteroids) {
    const existing = Asteroid.asteroids.get(a.id);
    if (!existing) continue;
    existing.updateFromServer(a, t);
  }
}

/* ------------------------------- weapons -------------------------------- */

function createWeapon(weapon: any) {
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
  newWeapon.updateFromServer(weapon, Websocket.serverTime);
  WeaponManager.weapons.set(newWeapon.id, newWeapon);
}

function setWeapons(weapons: any[]) {
  pruneMissing(WeaponManager.weapons, new Set(weapons.map((w) => w.id)));

  for (const weapon of weapons) {
    const existing = WeaponManager.weapons.get(weapon.id);
    if (existing && existing.name === weapon.name) {
      const ship = ShipManager.ships.get(weapon.shipId);
      if (!ship) continue;
      existing.updateFromServer(weapon, Websocket.serverTime);
      existing.ship = ship;
    } else {
      createWeapon(weapon);
    }
  }
}

function spawnWeapons(weapons: any[]) {
  for (const w of weapons) {
    if (!WeaponManager.weapons.has(w.id)) createWeapon(w);
  }
}

function updateWeapons(weapons: any[], t = Websocket.serverTime) {
  pruneMissing(WeaponManager.weapons, new Set(weapons.map((w) => w.id)));

  for (const w of weapons) {
    const existing = WeaponManager.weapons.get(w.id);
    if (!existing) continue;
    existing.updateFromServer(w, t);
  }
}

/* -------------------------------- perks --------------------------------- */

function createPerk(perk: any) {
  const perkClass = PerkManager.perkByName[perk.name];
  if (!perkClass) {
    console.warn(`Perk type ${perk.name} not found in PerkManager`);
    return;
  }

  const perkShip = perk.shipId ? ShipManager.ships.get(perk.shipId) : undefined;

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
  newPerk.updateFromServer(perk, Websocket.serverTime);
  if (perkShip) newPerk.setShip = perkShip;
  PerkManager.perks.set(newPerk.id, newPerk);
}

function setPerks(perks: any[]) {
  pruneMissing(PerkManager.perks, new Set(perks.map((p) => p.id)));

  for (const perk of perks) {
    const existing = PerkManager.perks.get(perk.id);
    if (existing && existing.name === perk.name) {
      existing.updateFromServer(perk, Websocket.serverTime);
      existing.setShip = (perk.shipId && ShipManager.ships.get(perk.shipId)) || null;
    } else {
      createPerk(perk);
    }
  }
}

function spawnPerks(perks: any[]) {
  for (const p of perks) {
    if (!PerkManager.perks.has(p.id)) createPerk(p);
  }
}

function updatePerks(perks: any[], t = Websocket.serverTime) {
  pruneMissing(PerkManager.perks, new Set(perks.map((p) => p.id)));

  for (const p of perks) {
    const existing = PerkManager.perks.get(p.id);
    if (!existing) continue;
    existing.updateFromServer(p, t);
    existing.setShip = (p.shipId && ShipManager.ships.get(p.shipId)) || null;
  }
}

// /* -------------------------------- keybinds ------------------------------- */

// keybinds["ArrowLeft"] = () => {
//   Websocket.socket?.emit("player:turn", { direction: "left" });
// };

// keybinds["ArrowRight"] = () => {
//   Websocket.socket?.emit("player:turn", { direction: "right" });
// };

// keybinds["ArrowUp"] = () => {
//   // FIX: was "player:ArrowUp", which the server has no listener for.
//   Websocket.socket?.emit("player:thrust", { direction: "forward" });
// };

// keybinds["ArrowDown"] = () => {
//   Websocket.socket?.emit("player:thrust", { direction: "backward" });
// };

// keybinds[" "] = () => {
//   Websocket.socket?.emit("player:fire");
// };
// keybinds["Enter"] = () => {
//   Websocket.socket?.emit("player:fire");
// };
// keybinds["Space"] = () => {
//   Websocket.socket?.emit("player:fire");
// };
