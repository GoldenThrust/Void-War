
import GatlingGun from "../weapons/gatlingGun.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";

export default class Tormenter extends Ship {
    constructor({ x = 10, y = 20, angle = 0, friend = false }) {
        super({ x, y, width: 50, height: 40, angle, acceleration: 800, color: "pink", vertices: shapes[2], name: "Tormenter Drone", maxWeaponHeat: 3000, life: 100, weapon: GatlingGun, friend });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    override update(t: number, dt: number) {
        super.update(t, dt);
        this.tacticalUpdate({ idealRange: 950, fleeRange: 300, fireRange: 3800, fireArc: Math.PI / 36, orbit: 0.45, lead: 0.8, turnMultiplier: 2, threatRange: 850 });
    }
}