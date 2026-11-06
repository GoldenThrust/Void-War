import type Weapon from "../../weapons/weapon";

export default class WeaponSound {
    public weapon;

    constructor(weapon: Weapon) {
        this.weapon = weapon;
    }


}