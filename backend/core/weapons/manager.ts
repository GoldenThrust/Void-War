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

  static weaponTypesByName = new Map<string, typeof Weapon>([
    ["Pulse Canon", PulseCanon],
    ["Gatling Gun", GatlingGun],
    ["Heavy RailGun", HeavyRailGun],
    ["Plasma Canon", PlasmaCanon],
    ["Homing Missile", HomingMissile],
    ["Mine", Mine],
  ]);

  static weapons: Map<string, Weapon> = new Map();

  static fire(weapon: typeof Weapon, options: WeaponC) {
    const newWeapon = new weapon(options);
    WeaponManager.weapons.set(newWeapon.id, newWeapon);
  }

  static createFromSnapshot(
    options: WeaponC & { name?: string; type?: string },
  ) {
    const WeaponType =
      this.weaponTypesByName.get(options.name ?? "") ?? PulseCanon;
    const weapon = new WeaponType(options);
    weapon.id = options.id ?? weapon.id;
    return weapon;
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
