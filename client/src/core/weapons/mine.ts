
import { assets } from "../assets/main.ts";
import { randomNum } from "../utils/random.ts";
import WeaponManager from "./manager.ts";
import { shapes } from "./shapes.ts";
import Weapon from "./weapon.ts";
import Minature from "./minature.ts";

export default class Mine extends Weapon {
    private duration;
    constructor(prop: WeaponC) {
        super({
            ...prop,
            name: "Mine",
            speed: prop.speed ?? 10,
            acceleration: 10000,
            x: prop.x,
            y: prop.y,
            width: 20,
            height: 20,
            angle: prop.angle,
            damage: 300,
            range: 1400,
            fireRate: 0.15,
            energyCost: 400,
            ship: prop.ship,
            color: prop.color,
            vertices: shapes[1],
            img: assets?.images?.mine
        });

        this.duration = 10000;
    }

    update() {
        this.colliding();
        if (!(--this.duration)) {
            this.destroy()
            this.explode(10, 1000)
        };
    }

    destroy() {
        super.destroy();
        this.explode(10)
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

    colide() {
        this.explode();
    }
}