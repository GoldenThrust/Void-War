import type Weapon from "./weapon.ts";
import PulseCanon from "./pulseCanon.ts";
import GatlingGun from "./gatlingGun.ts";
import HeavyRailGun from "./heavyRailGun.ts";
import PlasmaCanon from "./plasmaCanon.ts";
import Mine from "./mine.ts";
import HomingMissile from "./homingMissile.ts";

export default class WeaponManager {
  static weaponTypes = [
    PulseCanon,
    GatlingGun,
    HeavyRailGun,
    PlasmaCanon,
    HomingMissile,
    Mine,
  ];

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

}

export const weaponManager = new WeaponManager();
