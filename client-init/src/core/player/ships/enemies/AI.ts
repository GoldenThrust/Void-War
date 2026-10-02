import { assets } from "../../../assets/main.ts";
import PlasmaCanon from "../../../weapons/plasmaCanon.ts";
import { shapes } from "../shapes.ts";
import EnemyShip from "./enemy.ts";

export default class AI extends EnemyShip {
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