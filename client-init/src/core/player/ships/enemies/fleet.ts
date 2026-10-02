
import { assets } from "../../../assets/main.ts";
import PulseCanon from "../../../weapons/pulse-canon.ts";
import {  toroidalDistance, updateWrapped } from "../../../world/utils.ts";
import PlayerShip from "../player.ts";
import { shapes } from "../shapes.ts";
import EnemyShip from "./enemy.ts";

export default class FleetDrone extends EnemyShip {
    constructor({ x = 10, y = 20, angle = 0 }) {
        super({ x, y, width: 40, height: 40, angle, acceleration: 450, color: "springgreen", vertices: shapes[1], name: "Fleet Drone", maxWeaponHeat: 1000, life: 100, weapon: PulseCanon, img: assets?.images?.fleetship, flameImg: assets?.images?.flame3 });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        updateWrapped({
            fn: () => {
                const dist = toroidalDistance(this.x, this.y, PlayerShip.ship.x, PlayerShip.ship.y);
                super.update(t, dt);
                this.AI({
                    idleDistance: dist > 10 ** 10, fleeCondition: dist < 80000, seekCondition: (this.state === "flee" && dist > 7 ** 7) || this.state !== "flee", fireCondition: {
                        func: (delta: number) => Math.abs(delta) < Math.PI / 8,
                        others: dist < 3000000,
                    }
                })
            }, x: this.x, y: this.y, margin: {
                width: 4000,
                height: 4000
            }
        })
    }
}