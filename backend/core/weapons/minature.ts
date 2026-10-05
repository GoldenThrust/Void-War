import Projectile from "./projectile.ts";

export default class Minature extends Projectile {
    constructor(prop: WeaponC) {
        super({
            ...prop,
            name: "Minature",
            speed: prop.speed ?? 10,
            acceleration: prop.speed ?? 10,
            width: 10,
            height: 10,
            damage: 5,
            range: prop.range ?? 500,
            fireRate: 1,
            energyCost: 0,
        });
    }
}