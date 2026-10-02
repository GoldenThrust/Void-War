import { io } from "socket.io-client";
import OnlineShip from "./player/ships/onlineShip.ts";
import ShipManager from "./player/ships/manager.ts";
import Asteroid from "./world/object/asteroid/asteroid.ts";
import Perk from "./perks/perk.ts";
import PerkManager from "./perks/manager.ts";
import Weapon from "./weapons/weapon.ts";
import WeaponManager from "./weapons/manager.ts";

type Snapshot = {
  ships: Array<ShipC & { id: string; speed: number; state: string }>;
  weapons: Array<{ id: string; name: string; x: number; y: number; angle: number; active: boolean; width: number; height: number }>;
  asteroids: Array<{ id: string; x: number; y: number; angle: number; vertices: Vertices; width: number; height: number; speed: number; rotationSpeed: number }>;
  perks: Array<{ id: string; name: string; x: number; y: number; angle: number; width: number; height: number; vertices: Vertices; collectedBy: string | null }>;
  counts: { friendsAlive: number; enemiesAlive: number };
};

class RemoteWeapon extends Weapon {
  update(): void {}
}

export default class Websocket {
  public socket;
  constructor(url: string) {
    this.socket = io(url, {
      withCredentials: true,
      autoConnect: false,
    });
  }

  init() {
    if (this.socket.connected) return;

    this.socket.on("game:init", (state: Snapshot) => this.applySnapshot(state));
    this.socket.on("game:update", (state: Snapshot) => this.applySnapshot(state));
    this.socket.on("connect_error", (error) => {
      console.error("Unable to connect to game websocket", error.message);
    });
    this.socket.connect();
  }

  private applySnapshot(state: Snapshot) {
    const serverShipIds = new Set(state.ships.map(({ id }) => id));
    for (const remoteShip of state.ships) {
      let ship = ShipManager.ships.get(remoteShip.id);
      if (!ship) {
        ship = new OnlineShip(remoteShip);
        ship.id = remoteShip.id;
        ShipManager.ships.set(ship.id, ship);
      }

      ship.x = remoteShip.x;
      ship.y = remoteShip.y;
      ship.angle = remoteShip.angle;
      ship.speed = remoteShip.speed;
      ship.life = remoteShip.life ?? ship.life;
      ship.state = remoteShip.state;
    }

    for (const [id] of ShipManager.ships) {
      if (id !== "player" && !serverShipIds.has(id)) ShipManager.ships.delete(id);
    }

    const serverAsteroidIds = new Set(state.asteroids.map(({ id }) => id));
    for (const asteroidState of state.asteroids) {
      let asteroid = Asteroid.asteroids.get(asteroidState.id);
      if (!asteroid) {
        asteroid = new Asteroid();
        asteroid.id = asteroidState.id;
        Asteroid.asteroids.set(asteroid.id, asteroid);
      }
      asteroid.init(asteroidState);
    }
    for (const [id] of Asteroid.asteroids) {
      if (!serverAsteroidIds.has(id)) Asteroid.asteroids.delete(id);
    }

    const serverWeaponIds = new Set(state.weapons.map(({ id }) => id));
    const fallbackShip = ShipManager.ships.get("player") ?? ShipManager.ships.values().next().value;
    if (fallbackShip) {
      for (const weaponState of state.weapons) {
        let weapon = WeaponManager.weapons.get(weaponState.id);
        if (!weapon) {
          weapon = new RemoteWeapon({ ...weaponState, ship: fallbackShip });
          weapon.id = weaponState.id;
          WeaponManager.weapons.set(weapon.id, weapon);
        }
        weapon.x = weaponState.x;
        weapon.y = weaponState.y;
        weapon.angle = weaponState.angle;
        weapon.active = weaponState.active;
      }
      for (const [id] of WeaponManager.weapons) {
        if (!serverWeaponIds.has(id)) WeaponManager.weapons.delete(id);
      }
    }

    const serverPerkIds = new Set(state.perks.map(({ id }) => id));
    for (const perkState of state.perks) {
      let perk = PerkManager.perks.get(perkState.id);
      if (!perk) {
        perk = new Perk(perkState);
        perk.id = perkState.id;
        PerkManager.perks.set(perk.id, perk);
      }
      perk.x = perkState.x;
      perk.y = perkState.y;
      perk.angle = perkState.angle;
    }
    for (const [id] of PerkManager.perks) {
      if (!serverPerkIds.has(id)) PerkManager.perks.delete(id);
    }
  }
}

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";
export const websocket = new Websocket(backendUrl);
