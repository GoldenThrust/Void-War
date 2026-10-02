
import { assets } from "../../assets/main.ts";
import HeavyRailGun from "../../weapons/heavyRailGun.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";

export default class Sniper extends Ship {
    constructor({ x = 10, y = 20, angle = 0, friend = false }) {
        super({ x, y, width: 50, height: 50, angle, acceleration: 400, color: "red", vertices: shapes[3], name: "Sniper", maxWeaponHeat: 20000, life: 100, weapon: HeavyRailGun, img: assets?.images?.snipership, flameImg: assets?.images?.flame1, friend  });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        super.update(t, dt);
        this.tacticalUpdate({ idealRange: 14000, fleeRange: 3500, fireRange: 30000, fireArc: Math.PI / 40, lead: 1.5, turnMultiplier: 0.65 });
    }
}