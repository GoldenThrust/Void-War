
import { assets } from "../assets/main.ts";
import Projectile from "./projectile.ts";

export default class PulseCanon extends Projectile {
    constructor({ x, y, angle, ship, color, speed = 10 }: WeaponC) {
        super({
            name: "Pulse Canon",
            speed: speed,
            acceleration: 50000,
            x: x,
            y: y,
            width: 8,
            height: 15,
            angle: angle,
            damage: 40,
            range: 10000,
            fireRate: 0.5,
            energyCost: 50,
            ship,
            color,
            img: assets?.images?.projectile
        });
    }
}