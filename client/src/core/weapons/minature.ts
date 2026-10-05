
import { assets } from "../assets/main.ts";
import Projectile from "./projectile.ts";

export default class Minature extends Projectile {
    constructor(prop: WeaponC) {
        super({
            ...prop,
            name: "Minature",
            speed: prop.speed ?? 10,
            acceleration: prop.speed ?? 10,
            x: prop.x,
            y: prop.y,
            width: 10,
            height: 10,
            angle: prop.angle,
            damage: 5,
            range: prop.range ?? 500,
            fireRate: 1,
            energyCost: 0,
            ship: prop.ship,
            color: prop.color,
            img: assets?.images?.explosionflame
        });
    }
}