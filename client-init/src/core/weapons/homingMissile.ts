
import { clamp } from "../utils/math.ts";
import { toroidalDelta, toroidalDistance } from "../world/utils.ts";
import { world } from "../world/world.ts";
import PlasmaCanon from "./plasmaCanon.ts";
import Asteroid from "../world/object/asteroid/asteroid.ts";
import { assets } from "../assets/main.ts";
import type Ship from "../player/ships/ship.ts";

export default class HomingMissile extends PlasmaCanon {
    private target: Ship | null;
    private turnRate: number;
    constructor({ x, y, angle, ship, color, speed = 10 }: WeaponC) {
        super({
            name: "Homing Missile",
            speed: speed,
            acceleration: 15000,
            x: x,
            y: y,
            width: 15,
            height: 50,
            angle: angle,
            damage: 5,
            range: 50000,
            fireRate: 0.005,
            energyCost: 1000,
            ship,
            color,
            img: assets?.images?.homingmissile
        });

        this.target = null;
        this.turnRate = 0.01;
    }

    trackEnemy() {
        if (!this.target || this.target?.state === "dead" || this.distanceTraveled <= 200) return;

        // direction to target
        const dx = toroidalDelta(this.target.x, this.x, world.width);
        const dy = toroidalDelta(this.target.y, this.y, world.height);
        // const dx = this.target.x - this.x;
        // const dy = this.target.y - this.y;

        const targetAngle = Math.atan2(dy, dx);

        // smooth rotation toward target
        let diff = (targetAngle + this.angle) + Math.PI / 2;

        // normalize angle (-PI to PI)
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));

        // limit rotation speed
        this.angle += clamp(diff, this.turnRate)
        // this.angle += Math.max(-this.turnRate, Math.min(this.turnRate, diff));
    }

    update(t: number, dt: number) {
        this.trackEnemy();
        super.update(t, dt);
    }


    closeObject(obj: any) {
        // if (this.target) return;
        // if (this.ship instanceof EnemyShip && obj instanceof EnemyShip) return;
        // if (this.ship instanceof PlayerShip && obj instanceof PlayerShip) return;
        // else if (!(this.ship instanceof PlayerShip) && !(obj instanceof PlayerShip))
        if (obj instanceof Asteroid) return;
        const targetDistance = this.target ? toroidalDistance(this.target.x, this.target.y, this.x, this.y) : Infinity;
        const newDistance = toroidalDistance(obj.x, obj.y, this.x, this.y);


        this.target = (targetDistance > newDistance) ? obj : this.target;
    }
}