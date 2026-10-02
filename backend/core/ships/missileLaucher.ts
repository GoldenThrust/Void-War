import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";
import HomingMissile from "../weapons/homingMissile.ts";

export default class MissileLaucher extends Ship {
    constructor({ x = 10, y = 20, angle = 0, friend = false }) {
        super({ x, y, width: 50, height: 50, angle, acceleration: 320, color: "gold", vertices: shapes[6], name: "Missile Launcher", maxWeaponHeat: 1800, life: 170, weapon: HomingMissile, friend  });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    override update(t: number, dt: number) {
        super.update(t, dt);
        this.tacticalUpdate({ idealRange: 4200, fleeRange: 1200, fireRange: 10000, fireArc: Math.PI / 3, lead: 1.2, turnMultiplier: 0.8 });
    }
}