
import { randomNum } from "../utils/random.ts";
import Projectile from "./projectile.ts";
import Minature from "./minature.ts";
import WeaponManager from "./manager.ts";
import { assets } from "../assets/main.ts";

export default class PlasmaCanon extends Projectile {
    constructor({ x, y, angle, ship, color, name = "Plasma Canon", img = assets?.images?.plasma, acceleration = 25000, width = 10, height = 45, damage = 10, range = 5000, speed = 10, fireRate = 0.002, energyCost = 3000, }: WeaponC) {
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
            img,
        });
    }

    explode(radius = 1000) {
        if (!this.active) return;
        for (let i = 0; i < 100; i++) {
            const prop = {
                x: this.x - Math.sin(this.angle) * this.width,
                y: this.y - Math.cos(this.angle) * this.height,
                angle: randomNum(-Math.PI, Math.PI),
                speed: randomNum(radius / 2, radius),
                ship: this.ship,
                range: randomNum(radius * 0.1, radius / 2),
                color: "yellow"
            }


            WeaponManager.fire(Minature, prop)
        }
    }

    travelEnd() {
        this.explode()
    }

    colide() {
        this.explode();
    }

    // update(dt, manager) {
    //     super.update(dt, manager)
    // }
}