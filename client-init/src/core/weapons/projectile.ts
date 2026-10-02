import { wrap } from "../world/utils.ts";
import { world } from "../world/world.ts";
import { shapes } from "./shapes.ts";
import Weapon from "./weapon.ts";

export default class Projectile extends Weapon {
    constructor({ name, acceleration, speed, x, y, width, height, angle, damage, fireRate, range, energyCost, ship, penetration = 1, vertices = shapes[0], color = "red", img }: WeaponC) {
        super({ name, type: "projectile", x, y, width, height, acceleration, speed, angle, damage, range, energyCost, fireRate, ship, vertices, color, img, penetration });
    }

    update(_: number, dt: number) {
        this.speed = this.speed + (this.acceleration * dt);

        this.speed *= this.dampSpeed;

        this.x = wrap(this.x - Math.sin(this.angle) * (this.speed * dt), world.width);
        this.y = wrap(this.y - Math.cos(this.angle) * (this.speed * dt), world.height);

        this.distanceTraveled += (this.speed * dt);

        if (this.distanceTraveled >= this.range) {
            this.travelEnd();
            this.destroy();
        }

        this.colliding();
    }
}