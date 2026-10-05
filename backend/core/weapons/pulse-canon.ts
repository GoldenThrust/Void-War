import Projectile from "./projectile.ts";

export default class PulseCanon extends Projectile {
    constructor(prop: WeaponC) {
        super({
            ...prop,
            name: "Pulse Canon",
            acceleration: 50000,
            width: 8,
            height: 15,
            damage: 35,
            range: 10000,
            fireRate: 0.5,
            energyCost: 80,
        });
    }
}