
import { assets } from "../assets/main.ts";
import { randomNum } from "../utils/random.ts";
import Projectile from "./projectile.ts";

export default class GatlingGun extends Projectile {
    constructor(prop: WeaponC) {
        super({
            ...prop,
            name: "Gatling Gun",
            speed: prop.speed ?? 10,
            acceleration: 50000,
            x: prop.x,
            y: prop.y,
            width: 8,
            height: 15,
            angle: prop.angle,
            damage: 10,
            range: 8000,
            fireRate: 1,
            energyCost: 70,
            ship: prop.ship,
            color: prop.color,
            img: assets?.images?.projectile,
        });
    }

    update(t: number, dt: number) {
        this.angle += randomNum(-0.005, 0.005)
        super.update(t, dt);
    }
}