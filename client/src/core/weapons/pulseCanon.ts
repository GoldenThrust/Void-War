
import { assets } from "../assets/main.ts";
import Projectile from "./projectile.ts";

export default class PulseCanon extends Projectile {
    constructor(prop: WeaponC) {
        super({
            ...prop,
            name: "Pulse Canon",
            speed: prop.speed ?? 10,
            acceleration: 50000,
            x: prop.x,
            y: prop.y,
            width: 8,
            height: 15,
            angle: prop.angle,
            damage: 35,
            range: 10000,
            fireRate: 0.5,
            energyCost: 80,
            ship: prop.ship,
            color: prop.color,
            img: assets?.images?.projectile
        });
    }
}