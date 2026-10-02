
import { assets } from "../../../assets/main.ts";
import GatlingGun from "../../../weapons/gatlingGun.ts";
import { toroidalDistance, updateWrapped } from "../../../world/utils.ts";
import PlayerShip from "../player.ts";
import { shapes } from "../shapes.ts";
import EnemyShip from "./enemy.ts";

export default class Tormenter extends EnemyShip {
    constructor({ x = 10, y = 20, angle = 0 }) {
        super({ x, y, width: 50, height: 40, angle, acceleration: 600, color: "pink", vertices: shapes[2], name: "Tormenter Drone", maxWeaponHeat: 3000, life: 100, weapon: GatlingGun, img: assets?.images?.tormentership, flameImg: assets?.images?.flame6 });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        // const targetAngle = toroidalAngle(PlayerShip.ship.x, PlayerShip.ship.y, this.x, this.y);
        updateWrapped({
            fn: () => {
                const dist = toroidalDistance(this.x, this.y, PlayerShip.ship.x, PlayerShip.ship.y);
                super.update(t, dt);
                this.AI({
                    idleDistance: dist > 10 ** 12, fleeCondition: dist < 40000, seekCondition: (this.state === "flee" && dist > 10 ** 7) || this.state !== "flee", fireCondition: {
                        func: (delta: number) => Math.abs(delta) < Math.PI / 4,
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