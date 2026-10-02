import { assets } from "../../assets/main.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";
import HomingMissile from "../../weapons/homingMissile.ts";

export default class MissileLaucher extends Ship {
    constructor({ x = 10, y = 20, angle = 0, friend = false }) {
        super({ x, y, width: 50, height: 50, angle, acceleration: 300, color: "gold", vertices: shapes[6], name: "Missile Laucher", maxWeaponHeat: 3000, life: 150, weapon: HomingMissile, img: assets?.images?.missilelauchership, flameImg: assets?.images?.flame5, friend  });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        super.update(t, dt);
        this.tacticalUpdate({ idealRange: 4200, fleeRange: 1200, fireRange: 10000, fireArc: Math.PI / 3, lead: 1.2, turnMultiplier: 0.8 });
    }
}