import { assets } from "../src/core/assets/main.ts";
import PlasmaCanon from "../src/core/weapons/plasmaCanon.ts";
import { shapes } from "../src/core/player/ships/shapes.ts";
import Ship from "../src/core/player/ships/ship.ts";

export default class AI extends Ship {
    constructor({ x = 10, y = 20, angle = 0 }) {
        super({ x, y, width: 50, height: 50, angle, acceleration: 10000, color: "blue", vertices: shapes[4], name: "Bomber Drone", maxWeaponHeat: 10000, life: 200, weapon: PlasmaCanon, img: assets?.images?.bombership, flameImg: assets?.images?.flame2 });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;

        console.log("AI ship created", this);
        this.state = "AI";
    }

    update(t: number, dt: number, thrust = 0, turn = 0) {
        super.update(t, dt, thrust, turn);
    }
}