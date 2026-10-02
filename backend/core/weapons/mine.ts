

import { randomNum } from "../utils/random.ts";
import WeaponManager from "./manager.ts";
import { shapes } from "./shapes.ts";
import Weapon from "./weapon.ts";
import Minature from "./minature.ts";

export default class Mine extends Weapon {
    private duration;
    constructor({ x, y, angle, ship, color, speed = 10 }: WeaponC) {
        super({
            name: "Mine",
            speed: speed,
            acceleration: 10000,
            x: x,
            y: y,
            width: 20,
            height: 20,
            angle: angle,
            damage: 300,
            range: 1400,
            fireRate: 0.15,
            energyCost: 400,
            ship,
            color,
            vertices: shapes[1],
        });

        this.duration = 10000;
    }

    override update() {
        this.colliding();
        if (!(--this.duration)) {
            this.explode(10, 1000);
            this.destroy();
        };
    }

    override destroy() {
        if (!this.active) return;
        this.explode(10);
        super.destroy();
    }


    explode(particles = 50, radius = 1000) {
        if (!this.active) return;
        for (let i = 0; i < particles; i++) {
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

    override colide() {
        this.explode();
    }
}