
import PulseCanon from "./pulse-canon.ts";
import GatlingGun from "./gatlingGun.ts";
import HeavyRailGun from "./heavyRailGun.ts";
import PlasmaCanon from "./plasmaCanon.ts";
import Mine from "./mine.ts";
import HomingMissile from "./homingMissile.ts";
import { keybinds } from "../events/keybind.ts";
import { worldManager } from "../world/manager.ts";
import type Weapon from "./weapon.ts";

export default class WeaponManager {
    constructor() {
        this.#addKeybinds();
    }

    static weaponTypes = [PulseCanon, GatlingGun, HeavyRailGun, PlasmaCanon, HomingMissile, Mine];

    static weapons: Weapon[] = [];

    static fire(weapon: typeof Weapon, options: WeaponC) {
        WeaponManager.weapons.push(new weapon(options));
    }

    static render() {
        for (const weapon of WeaponManager.weapons) {
            weapon.render();
        }
    }

    static update(t: number, dt: number) {
        for (const weapon of WeaponManager.weapons) {
            weapon.update(t, dt);
        }
    }

    static destroy(weapon: Weapon) {
        const index = WeaponManager.weapons.indexOf(weapon);
        if (index > -1) {
            WeaponManager.weapons.splice(index, 1);
        }
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