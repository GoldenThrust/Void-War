import { io } from "socket.io-client";
import OnlineShip from "./player/ships/onlineShip.ts";
import ShipManager from "./player/ships/manager.ts";
import Asteroid from "./world/object/asteroid/asteroid.ts";
import Perk from "./perks/perk.ts";
import PerkManager from "./perks/manager.ts";
import Weapon from "./weapons/weapon.ts";
import WeaponManager from "./weapons/manager.ts";
import { lerp, shortestAngleDist } from "./utils/math.ts";
import { worldSize } from "./utils/constants.ts";

type Snapshot = {
  ships: Array<ShipC & { id: string; speed: number; state: string }>;
  weapons: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    angle: number;
    active: boolean;
    width: number;
    height: number;
    ship: string;
  }>;
  asteroids: Array<{
    id: string;
    x: number;
    y: number;
    angle: number;
    vertices: Vertices;
    width: number;
    height: number;
    speed: number;
    rotationSpeed: number;
  }>;
  perks: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    angle: number;
    width: number;
    height: number;
    vertices: Vertices;
    collectedBy: string | null;
  }>;
  counts: { friendsAlive: number; enemiesAlive: number };
  playerId?: string;
};

class RemoteWeapon extends Weapon {
  update(): void {}
}

function toroidalLerp(
  current: number,
  target: number,
  t: number,
  size: number,
) {
  const clampedT = Math.max(0, Math.min(1, t));
  let delta = target - current;
  if (delta > size * 0.5) delta -= size;
  if (delta < -size * 0.5) delta += size;

  return (((current + delta * clampedT) % size) + size) % size;
}

export default class Websocket {
  public socket;
  private initialized = false;
  private running = false;
  private lastSnapshotAt = 0;
  private playerId?: string;
  private resyncRequested = false;

  constructor(url: string) {
    this.socket = io(url, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.25,
    });
  }

  init() {
    if (this.running) {
      if (!this.socket.connected) this.socket.connect();
      return;
    }

    this.socket.on("game:init", (state: Snapshot) =>
      this.applyInitSnapshot(state),
    );
    this.running = true;
    this.socket.on("game:update", (state: Snapshot) =>
      this.applyUpdateSnapshot(state),
    );

    this.socket.on("connect_error", (error) => {
      console.error("Unable to connect to game websocket", error.message);
    });
    this.socket.connect();
  }

  update() {
    if (!this.socket || !this.socket.connected) return;
    const ship = ShipManager.ships.get("player");
    if (!ship) return;
    
    const shipState = {
      id: ship.id,
      x: ship.x,
      y: ship.y,
      angle: ship.angle,
      speed: ship.speed,
    };

    const weaponsState = Array.from(WeaponManager.weapons.values())
      .filter((weapon) => weapon.ship.id === ship.id)
      .map((weapon) => ({
        id: weapon.id,
        x: weapon.x,
        y: weapon.y,
        angle: weapon.angle,
        speed: weapon.speed,
      }));

  
      // console.log("Sending player update", { ship: shipState, weapons: weaponsState });

    this.socket.emit("player:update", {
      ship: shipState,
      weapons: weaponsState,
    })
  }
  
  private applyInitSnapshot(state: Snapshot) {
    this.playerId = state.playerId ?? this.playerId;
    this.resyncRequested = false;

    for (const remoteShip of state.ships) {
      if (remoteShip.id === this.playerId) continue;
      let ship = ShipManager.ships.get(remoteShip.id);
      if (!ship) {
        ship = new OnlineShip(remoteShip);
        ship.id = remoteShip.id;
        ship.speed = remoteShip.speed;
        ShipManager.ships.set(ship.id, ship);
      }
    }
    for (const asteroidState of state.asteroids) {
      let asteroid = Asteroid.asteroids.get(asteroidState.id);
      if (!asteroid) {
        asteroid = new Asteroid();
        asteroid.init(asteroidState);
        Asteroid.asteroids.set(asteroid.id, asteroid);
      }
    }

    for (const weaponState of state.weapons) {
      let weapon = WeaponManager.weapons.get(weaponState.id);
      if (!weapon) {
        const ship = ShipManager.ships.get(weaponState.ship);
        if (!ship) continue;
        weapon = new RemoteWeapon({
          ...weaponState,
          ship: ship,
        });
        weapon.id = weaponState.id;
        WeaponManager.weapons.set(weapon.id, weapon);
      }
    }

    for (const perkState of state.perks) {
      let perk = PerkManager.perks.get(perkState.id);
      if (!perk) {
        perk = new Perk(perkState);
        perk.id = perkState.id;
        PerkManager.perks.set(perk.id, perk);
      }
    }

    ShipManager.friendsAlive = state.counts.friendsAlive;
    ShipManager.enemiesAlive = state.counts.enemiesAlive;
    this.initialized = true;
  }

  private applyUpdateSnapshot(state: Snapshot) {
    let requestUpdate = false;

    const now = performance.now();
    const snapshotDelta = this.lastSnapshotAt ? now - this.lastSnapshotAt : 0;
    this.lastSnapshotAt = now;
    if (!this.initialized) return;
    const t = snapshotDelta > 0
      ? 1 - Math.exp(-Math.min(snapshotDelta, 100) / 80)
      : 0;

    const serverShipIds = new Set(state.ships.map(({ id }) => id));
    for (const remoteShip of state.ships) {
      if (remoteShip.id === this.playerId) continue;
      let ship = ShipManager.ships.get(remoteShip.id);
      if (!ship) {
        requestUpdate = true;
        continue;
      }
      ship.x = toroidalLerp(ship.x, remoteShip.x, t, worldSize.width);
      ship.y = toroidalLerp(ship.y, remoteShip.y, t, worldSize.height);
      ship.angle += shortestAngleDist(ship.angle, remoteShip.angle) * t;
      ship.life = lerp(ship.life, remoteShip.life ?? ship.life, t);
    }

    for (const [id] of ShipManager.ships) {
      if (id !== "player" && id !== this.playerId && !serverShipIds.has(id))
        ShipManager.ships.delete(id);
    }

    const serverAsteroidIds = new Set(state.asteroids.map(({ id }) => id));
    for (const asteroidState of state.asteroids) {
      let asteroid = Asteroid.asteroids.get(asteroidState.id);
      if (!asteroid) {
        requestUpdate = true;
        continue;
      }

      // console.log("Asteroid update", asteroidState, "t:", t);

      asteroid.x = toroidalLerp(
        asteroid.x,
        asteroidState.x,
        t,
        worldSize.width,
      );
      asteroid.y = toroidalLerp(
        asteroid.y,
        asteroidState.y,
        t,
        worldSize.height,
      );
      asteroid.angle +=
        shortestAngleDist(asteroid.angle, asteroidState.angle) * t;
    }
    for (const [id] of Asteroid.asteroids) {
      if (!serverAsteroidIds.has(id)) Asteroid.asteroids.delete(id);
    }

    const serverWeaponIds = new Set(state.weapons.map(({ id }) => id));

    for (const weaponState of state.weapons) {
      let weapon = WeaponManager.weapons.get(weaponState.id);
      if (!weapon) {
        requestUpdate = true;
        continue;
      }
      weapon.x = toroidalLerp(weapon.x, weaponState.x, t, worldSize.width);
      weapon.y = toroidalLerp(weapon.y, weaponState.y, t, worldSize.height);
      weapon.angle += shortestAngleDist(weapon.angle, weaponState.angle) * t;
    }
    for (const [id] of WeaponManager.weapons) {
      const weapon = WeaponManager.weapons.get(id);
      const isLocalWeapon = weapon?.ship.id === "player";
      if (!isLocalWeapon && !serverWeaponIds.has(id)) WeaponManager.weapons.delete(id);
    }

    const serverPerkIds = new Set(state.perks.map(({ id }) => id));
    for (const perkState of state.perks) {
      let perk = PerkManager.perks.get(perkState.id);
      if (!perk) {
        requestUpdate = true;
        continue;
      }
      perk.x = toroidalLerp(perk.x, perkState.x, t, worldSize.width);
      perk.y = toroidalLerp(perk.y, perkState.y, t, worldSize.height);
      perk.angle += shortestAngleDist(perk.angle, perkState.angle) * t;
    }
  
    for (const [id] of PerkManager.perks) {
      if (!serverPerkIds.has(id)) PerkManager.perks.delete(id);
    }

    ShipManager.friendsAlive = state.counts.friendsAlive;
    ShipManager.enemiesAlive = state.counts.enemiesAlive;

    if (requestUpdate && !this.resyncRequested) {
      this.resyncRequested = true;
      this.socket.emit("game:resync");
    }
  }
}
