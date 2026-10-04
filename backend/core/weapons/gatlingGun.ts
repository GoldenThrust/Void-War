import { randomNum } from "../utils/random.ts";
import Projectile from "./projectile.ts";

export default class GatlingGun extends Projectile {
    constructor({ x, y, angle, ship, color, speed = 10 }: WeaponC) {
        super({
            name: "Gatling Gun",
            speed: speed,
            acceleration: 50000,
            x: x,
            y: y,
            width: 8,
            height: 15,
            angle: angle,
            damage: 10,
            range: 8000,
            fireRate: 1,
            energyCost: 70,
            ship,
            color,
        });
    }

    override update(t: number, dt: number) {
        this.angle += randomNum(-0.005, 0.005)
        super.update(t, dt);
    }
}