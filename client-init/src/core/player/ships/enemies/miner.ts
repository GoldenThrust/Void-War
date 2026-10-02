
import { assets } from "../../../assets/main.ts";
import { FIXED_DT } from "../../../utils/constants.ts";
import { clamp, lerp } from "../../../utils/math.ts";
import Mine from "../../../weapons/mine.ts";
import type Weapon from "../../../weapons/weapon.ts";
import { toroidalDistance, updateWrapped, wrap } from "../../../world/utils.ts";
import PlayerShip from "../player.ts";
import { shapes } from "../shapes.ts";
import EnemyShip from "./enemy.ts";

export default class Miner extends EnemyShip {
    constructor({ x = 10, y = 20, angle = 0 }) {
        super({ x, y, width: 50, height: 50, angle, acceleration: 650, color: "azure", vertices: shapes[5], name: "Miner Drone", maxWeaponHeat: 100, life: 300, weapon: Mine, img: assets?.images?.minership, flameImg: assets?.images?.flame4 });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    closeWeapon(_: Weapon, dist: number, alpha: number) {
        if (dist > 7 ** 7) return;
        if (Math.abs(alpha + Math.PI / 2) < Math.PI / 8) {
            this.fire();
        }

        const beta = alpha + Math.PI / 2;

        const delta = Math.atan2(Math.sin(beta), Math.cos(beta));

        this.angle = wrap(lerp(this.angle, this.angle - clamp(delta, -this.turnRate, this.turnRate) * FIXED_DT * this.speedFactor, 0.3), Math.PI * 2);
    }

    update(t: number, dt: number) {
        // const targetAngle = toroidalAngle(PlayerShip.ship.x, PlayerShip.ship.y, this.x, this.y);
        updateWrapped({
            fn: () => {
                const dist = toroidalDistance(this.x, this.y, PlayerShip.ship.x, PlayerShip.ship.y);
                super.update(t, dt);
                this.AI({
                    idleDistance: dist > 10 ** 12, fleeCondition: this.weaponState === "hot", seekCondition: (this.state === "flee" && dist > 10 ** 7) || this.state !== "flee", fireCondition: {
                        func: (delta: number) => Math.abs(delta + Math.PI) < Math.PI / 2,
                        others: dist < 500000,
                    }
                })
            }, x: this.x, y: this.y, margin: {
                width: 4000,
                height: 4000
            }
        })
    }
}