import { assets } from "../../assets/main.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";
import HomingMissile from "../../weapons/homingMissile.ts";

export default class MissileLaucher extends Ship {
    constructor(prop: ShipC) {
        super({ ...prop, x: prop.x ?? 10, y: prop.y ?? 20, width: 50, height: 50, angle: prop.angle ?? 0, acceleration: 480, color: "gold", vertices: shapes[6], name: "Missile Launcher", maxWeaponHeat: 1800, life: 170, weapon: HomingMissile, img: assets?.images?.missilelauchership, flameImg: assets?.images?.flame5, friend: prop.friend ?? false });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        super.update(t, dt);
        this.tacticalUpdate({ idealRange: 4200, fleeRange: 1200, fireRange: 10000, fireArc: Math.PI / 3, lead: 1.2, turnMultiplier: 0.8 });
    }
}