import { keybinds } from "../events/keybind.ts";
import { worldManager } from "../world/manager.ts";
import type Weapon from "./weapon.ts";
import PulseCanon from "./pulseCanon.ts";
import GatlingGun from "./gatlingGun.ts";
import HeavyRailGun from "./heavyRailGun.ts";
import PlasmaCanon from "./plasmaCanon.ts";
import Mine from "./mine.ts";
import HomingMissile from "./homingMissile.ts";

export default class WeaponManager {
    constructor() {
        this.#addKeybinds();
    }

    static weaponTypes = [PulseCanon, GatlingGun, HeavyRailGun, PlasmaCanon, HomingMissile, Mine];

    static weapons: Map<string, Weapon> = new Map();

    static fire(weapon: typeof Weapon, options: WeaponC) {
        const newWeapon = new weapon(options);
        WeaponManager.weapons.set(newWeapon.id, newWeapon);
    }

    static render() {
        for (const weapon of WeaponManager.weapons.values()) {
            weapon.render();
        }
    }

    static update(t: number, dt: number) {
        for (const weapon of WeaponManager.weapons.values()) {
            weapon.update(t, dt);
        }
    }

    static destroy(weapon: Weapon) {
            WeaponManager.weapons.delete(weapon.id);
    }


    #addKeybinds() {
        for (let i = 0; i < WeaponManager.weaponTypes.length; i++) {
            keybinds[`${i}`] = () => {
                this.changeWeapon(WeaponManager.weaponTypes[i]);
            }
        }

        keybinds["q"] = () => {
            this.previousWeapon();
        }

        keybinds["e"] = () => {
            this.nextWeapon();
        }
    }

    nextWeapon() {
        const ship = worldManager.findAttachedShip();
        const currentWeaponId = WeaponManager.weaponTypes.findIndex(w => w === ship.weapon) + 1;

        const nextWeapon = WeaponManager.weaponTypes[currentWeaponId] || WeaponManager.weaponTypes[0];

        this.changeWeapon(nextWeapon);
    }

    previousWeapon() {
        const ship = worldManager.findAttachedShip();

        const currentWeaponId = WeaponManager.weaponTypes.findIndex(w => w === ship.weapon) - 1;
        const previousWeapon = WeaponManager.weaponTypes[currentWeaponId] || WeaponManager.weaponTypes[WeaponManager.weaponTypes.length - 1];

        this.changeWeapon(previousWeapon);
    }

    changeWeapon(weapon: typeof Weapon) {
        worldManager.findAttachedShip().weapon = weapon;
    }
}

// Todo: createWeapon pool
export const weaponManager = new WeaponManager();