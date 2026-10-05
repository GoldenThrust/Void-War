import Projectile from "./projectile.ts";

export default class HeavyRailGun extends Projectile {
    constructor(prop: WeaponC) {
        super({
            ...prop,
            name: "Heavy RailGun",
            speed: (prop.speed ?? 10) * 5,
            acceleration: 50000,
            width: 10,
            height: 70,
            damage: 450,
            range: 30000,
            fireRate: 0.08,
            energyCost: 1000,
            penetration: 2,
        });
    }
}