import { assets } from "../../assets/main.ts";
import PlasmaCanon from "../../weapons/plasmaCanon.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";

export default class Bomber extends Ship {
    constructor({ x = 10, y = 20, angle = 0, friend = false }) {
        super({ x, y, width: 56, height: 56, angle, acceleration: 420, color: "blue", vertices: shapes[4], name: "Bomber Drone", maxWeaponHeat: 1800, life: 240, weapon: PlasmaCanon, img: assets?.images?.bombership, flameImg: assets?.images?.flame2, friend  });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        super.update(t, dt);
        this.tacticalUpdate({ idealRange: 1800, fleeRange: 450, fireRange: 7000, fireArc: Math.PI / 10, lead: 0.35 });
    }
}