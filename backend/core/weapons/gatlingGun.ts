import { randomNum } from "../utils/random.ts";
import Projectile from "./projectile.ts";

export default class GatlingGun extends Projectile {
    constructor(prop: WeaponC) {
        super({
            ...prop,
            name: "Gatling Gun",
            acceleration: 50000,
            width: 8,
            height: 15,
            damage: 10,
            range: 8000,
            fireRate: 1,
            energyCost: 70,
        });
    }

    override update(t: number, dt: number) {
        this.angle += randomNum(-0.005, 0.005)
        super.update(t, dt);
    }
}