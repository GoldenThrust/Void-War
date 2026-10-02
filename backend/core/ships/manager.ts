import { sizeOf } from "../utils/constants.ts";
import { randomNum } from "../utils/random.ts";
import { world } from "../world/world.ts";
import { destroyedShips } from "./ship.ts";
import Bomber from "./bomber.ts";
import FleetDrone from "./fleet.ts";
import Miner from "./miner.ts";
import MissileLaucher from "./missileLaucher.ts";
import Sniper from "./sniper.ts";
import Tormenter from "./tormenter.ts";
import type Ship from "./ship.ts";

export default class ShipManager {
  static ships: Map<string, Ship> = new Map();
  static types = [FleetDrone, Tormenter, Bomber, Sniper, Miner, MissileLaucher];
  static enemiesAlive = 0;
  static friendsAlive = 0;

  static init() {
    ShipManager.enemiesAlive = sizeOf.enemyShip;
    for (let i = 0; i < sizeOf.enemyShip; i++) {
      const prop = {
        x: randomNum(0, world.width),
        y: randomNum(0, world.height),
        angle: randomNum(-Math.PI * 2, Math.PI * 2),
      };

      const ship = new ShipManager.types[
        Math.floor(randomNum(0, this.types.length))
      ]!({ ...prop, friend: false });

      ShipManager.ships.set(ship.id, ship);
    }

    ShipManager.friendsAlive = sizeOf.friendShip + 1;
    for (let i = 0; i < sizeOf.friendShip; i++) {
      const prop = {
        x: randomNum(0, world.width),
        y: randomNum(0, world.height),
        angle: randomNum(-Math.PI * 2, Math.PI * 2),
      };

      const ship = new this.types[Math.floor(randomNum(0, this.types.length))]!(
        { ...prop, friend: true },
      );

      ShipManager.ships.set(ship.id, ship);
    }
  }

  static destroy(ship: Ship) {
      ship.state = "dead";
      ShipManager.ships.delete(ship.id)
      destroyedShips.push(ship);
      if (ship.friend) --ShipManager.friendsAlive;
      else --ShipManager.enemiesAlive;
  }

  static update(t: number, dt: number) {
    for (const ship of ShipManager.ships.values()) {
      ship.update(t, dt);
    }
  }
}
