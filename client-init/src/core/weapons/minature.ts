
import { assets } from "../assets/main.ts";
import Projectile from "./projectile.ts";
export default class Minature extends Projectile {
    constructor({ x, y, angle, ship, range = 500, color, speed = 10 }: WeaponC) {
        super({
            name: "Minature",
            speed: speed,
            acceleration: speed,
            x: x,
            y: y,
            width: 10,
            height: 10,
            angle: angle,
            damage: 5,
            range,
            fireRate: 1,
            energyCost: 0,
            ship,
            color,
            img: assets?.images?.explosionflame
        });
    }
}