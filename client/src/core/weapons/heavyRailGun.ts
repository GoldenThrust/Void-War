
import { assets } from "../assets/main.ts";
import Projectile from "./projectile.ts";

export default class HeavyRailGun extends Projectile {
    constructor(prop: WeaponC) {
        super({
            ...prop,
            name: "Heavy RailGun",
            speed: (prop.speed ?? 10) * 5,
            acceleration: 50000,
            x: prop.x,
            y: prop.y,
            width: 10,
            height: 70,
            angle: prop.angle,
            damage: 450,
            range: 30000,
            fireRate: 0.08,
            energyCost: 1000,
            penetration: 2,
            ship: prop.ship,
            color: prop.color,
            img: assets?.images?.heavyrailgun
        });
    }

    // update(dt, manager) {
    //     super.update(dt, manager)
    // }
}