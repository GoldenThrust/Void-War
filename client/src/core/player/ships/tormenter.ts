
import { assets } from "../../assets/main.ts";
import GatlingGun from "../../weapons/gatlingGun.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";

export default class Tormenter extends Ship {
    constructor(prop: ShipC) {
        super({ ...prop, x: prop.x ?? 10, y: prop.y ?? 20, width: 50, height: 40, angle: prop.angle ?? 0, acceleration: 560, color: "pink", vertices: shapes[2], name: "Tormenter Drone", maxWeaponHeat: 1200, life: 140, weapon: GatlingGun, img: assets?.images?.tormentership, flameImg: assets?.images?.flame6, friend: prop.friend ?? false });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        super.update(t, dt);
        this.tacticalUpdate({ idealRange: 950, fleeRange: 300, fireRange: 3800, fireArc: Math.PI / 36, orbit: 0.45, lead: 0.8, turnMultiplier: 2, threatRange: 850 });
    }
}