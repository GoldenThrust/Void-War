import Projectile from "./projectile.ts";

export default class HeavyRailGun extends Projectile {
    constructor({ x, y, angle, ship, color, speed = 10 }: WeaponC) {
        super({
            name: "Heavy RailGun",
            speed: speed * 5,
            acceleration: 50000,
            x: x,
            y: y,
            width: 10,
            height: 70,
            angle: angle,
            damage: 450,
            range: 30000,
            fireRate: 0.08,
            energyCost: 1100,
            penetration: 2,
            ship,
            color,
        });
    }
}