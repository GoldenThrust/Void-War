import { keybinds } from "../events/keybind.ts";
import { worldManager } from "../world/manager.ts";
import type Weapon from "./weapon.ts";
import PulseCanon from "./pulseCanon.ts";
import GatlingGun from "./gatlingGun.ts";
import HeavyRailGun from "./heavyRailGun.ts";
import PlasmaCanon from "./plasmaCanon.ts";
import Mine from "./mine.ts";
import HomingMissile from "./homingMissile.ts";
import Websocket from "../socket/websocket.ts";

export default class WeaponManager {
  constructor() {
    this.#addKeybinds();
  }

  static weaponTypes = [
    PulseCanon,
    GatlingGun,
    HeavyRailGun,
    PlasmaCanon,
    HomingMissile,
    Mine,
  ];

  static weaponsByName: Record<string, typeof Weapon> = {
    "Pulse Canon": PulseCanon,
    "Gatling Gun": GatlingGun,
    "Heavy RailGun": HeavyRailGun,
    "Plasma Canon": PlasmaCanon,
    "Homing Missile": HomingMissile,
    "Mine": Mine,
  }

  static weapons: Map<string, Weapon> = new Map();
  private static readonly pools = new Map<Function, Weapon[]>();
  private static readonly maxPoolSize = 128;

  static fire(weapon: typeof Weapon, options: WeaponC) {
    const pool = WeaponManager.pools.get(weapon);
    const pooledWeapon = pool?.pop();
    const newWeapon = pooledWeapon ?? new weapon(options);
    if (pooledWeapon) {
      newWeapon.reactivate(options);
    }
    WeaponManager.weapons.set(newWeapon.id, newWeapon);
  }

  static render() {
    try {
      for (const weapon of WeaponManager.weapons.values()) {
        weapon.render();
      }
    } catch (error) {
      console.log("error in weapon render", error);
    }
  }

  static update(t: number, dt: number) {
    try {
      for (const weapon of WeaponManager.weapons.values()) {
        weapon.update(t, dt);
      }
    } catch (error) {
      console.log("error in weapon update", error);
    }
  }

  static destroy(weapon: Weapon) {
    if (!WeaponManager.weapons.delete(weapon.id)) return;

    const type = weapon.constructor;
    const pool = WeaponManager.pools.get(type) ?? [];
    if (pool.length < WeaponManager.maxPoolSize) {
      pool.push(weapon);
      WeaponManager.pools.set(type, pool);
    }
  }

  #addKeybinds() {
    for (let i = 0; i < WeaponManager.weaponTypes.length; i++) {
      keybinds[`${i}`] = () => {
        this.changeWeapon(WeaponManager.weaponTypes[i]);
      };
    }

    keybinds["q"] = () => {
      this.previousWeapon();
    };

    keybinds["e"] = () => {
      this.nextWeapon();
    };
  }

  nextWeapon() {
    const ship = worldManager.findAttachedShip();
    const currentWeaponId =
      WeaponManager.weaponTypes.findIndex((w) => w === ship.weapon) + 1;

    const nextWeapon =
      WeaponManager.weaponTypes[currentWeaponId] ||
      WeaponManager.weaponTypes[0];

    this.changeWeapon(nextWeapon);
  }

  previousWeapon() {
    const ship = worldManager.findAttachedShip();

    const currentWeaponId =
      WeaponManager.weaponTypes.findIndex((w) => w === ship.weapon) - 1;
    const previousWeapon =
      WeaponManager.weaponTypes[currentWeaponId] ||
      WeaponManager.weaponTypes[WeaponManager.weaponTypes.length - 1];

    this.changeWeapon(previousWeapon);
  }

  changeWeapon(weapon: typeof Weapon) {
    worldManager.findAttachedShip().weapon = weapon;

    Websocket.socket?.emit("player:changeWeapon", {
      weaponName: weapon.name,
    });
  }
}

export const weaponManager = new WeaponManager();
