
import { assets } from "../../assets/main.ts";
import HeavyRailGun from "../../weapons/heavyRailGun.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";

export default class Sniper extends Ship {
    constructor(prop: ShipC) {
        super({ ...prop, x: prop.x ?? 10, y: prop.y ?? 20, width: 50, height: 50, angle: prop.angle ?? 0, acceleration: 500, color: "red", vertices: shapes[3], name: "Sniper", maxWeaponHeat: 2200, life: 180, weapon: HeavyRailGun, img: assets?.images?.snipership, flameImg: assets?.images?.flame1, friend: prop.friend ?? false });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        super.update(t, dt);
        this.tacticalUpdate({ idealRange: 14000, fleeRange: 3500, fireRange: 30000, fireArc: Math.PI / 40, lead: 1.5, turnMultiplier: 0.65 });
    }
}