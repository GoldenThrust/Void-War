import PlasmaCanon from "../weapons/plasmaCanon.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";

export default class Bomber extends Ship {
    constructor({ x = 10, y = 20, angle = 0, friend = false }) {
        super({ x, y, width: 50, height: 50, angle, acceleration: 600, color: "blue", vertices: shapes[4], name: "Bomber Drone", maxWeaponHeat: 10000, life: 200, weapon: PlasmaCanon, friend  });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    override update(t: number, dt: number) {
        super.update(t, dt);
        this.tacticalUpdate({ idealRange: 1800, fleeRange: 450, fireRange: 7000, fireArc: Math.PI / 10, lead: 0.35 });
    }
}