import type Weapon from "./weapon.ts";
import PulseCanon from "./pulse-canon.ts";
import GatlingGun from "./gatlingGun.ts";
import HeavyRailGun from "./heavyRailGun.ts";
import PlasmaCanon from "./plasmaCanon.ts";
import Mine from "./mine.ts";
import HomingMissile from "./homingMissile.ts";

export default class WeaponManager {
  constructor() {}

  static weaponTypes = [
    PulseCanon,
    GatlingGun,
    HeavyRailGun,
    PlasmaCanon,
    HomingMissile,
    Mine,
  ];

  static weapons: Map<string, Weapon> = new Map();

  static fire(weapon: typeof Weapon, options: WeaponC) {
    const newWeapon = new weapon(options);
    WeaponManager.weapons.set(newWeapon.id, newWeapon);
  }

  static update(t: number, dt: number) {
    for (const weapon of WeaponManager.weapons.values()) {
      weapon.update(t, dt);
    }
  }

  static destroy(weapon: Weapon) {
    WeaponManager.weapons.delete(weapon.id);
  }
}

// Todo: createWeapon pool
export const weaponManager = new WeaponManager();
