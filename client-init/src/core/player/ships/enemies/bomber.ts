import { assets } from "../../../assets/main.ts";
import PlasmaCanon from "../../../weapons/plasmaCanon.ts";
import { toroidalDistance, updateWrapped } from "../../../world/utils.ts";
import PlayerShip from "../player.ts";
import { shapes } from "../shapes.ts";
import EnemyShip from "./enemy.ts";

export default class Bomber extends EnemyShip {
    constructor({ x = 10, y = 20, angle = 0 }) {
        super({ x, y, width: 50, height: 50, angle, acceleration: 600, color: "blue", vertices: shapes[4], name: "Bomber Drone", maxWeaponHeat: 10000, life: 200, weapon: PlasmaCanon, img: assets?.images?.bombership, flameImg: assets?.images?.flame2 });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        updateWrapped({
            fn: () => {
                const dist = toroidalDistance(this.x, this.y, PlayerShip.ship.x, PlayerShip.ship.y);
                super.update(t, dt);
                this.AI({
                    idleDistance: dist > 10 ** 12, fleeCondition: dist < 80000, seekCondition: (this.state === "flee" && dist > 10 ** 7) || this.state !== "flee", fireCondition: {
                        func: (delta: number) => Math.abs(delta) < Math.PI / 6,
                        others: dist < 5000000,
                    }
                })
            }, x: this.x, y: this.y, margin: {
                width: 4000,
                height: 4000
            }
        })
    }
}