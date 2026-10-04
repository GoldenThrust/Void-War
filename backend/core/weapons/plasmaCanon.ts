
import { randomNum } from "../utils/random.ts";
import Projectile from "./projectile.ts";
import WeaponManager from "./manager.ts";
import Minature from "./minature.ts";


export default class PlasmaCanon extends Projectile {
    constructor({ x, y, angle, ship, color, name = "Plasma Canon", acceleration = 25000, width = 10, height = 45, damage = 120, range = 45000, speed = 100, fireRate = 0.15, energyCost = 600, }: WeaponC) {
        super({
            name,
            speed: speed,
            acceleration,
            x: x,
            y: y,
            width,
            height,
            angle,
            damage,
            range,
            fireRate,
            energyCost,
            ship,
            color,
        });
    }

    explode(radius = 1000) {
        if (!this.active) return;
        for (let i = 0; i < 10; i++) {
            const prop = {
                x: this.x - Math.sin(this.angle) * this.width,
                y: this.y - Math.cos(this.angle) * this.height,
                angle: this.angle + Math.PI / 8 + randomNum(0, -Math.PI / 4),
                speed: randomNum(this.speed, this.speed / 2),
                ship: this.ship,
                range: randomNum(radius * 0.2, radius * 2),
                color: "yellow"
            }


            WeaponManager.fire(Minature, prop)
        }
    }

    override travelEnd() {
        this.explode()
    }

    override colide() {
        this.explode();
    }
}