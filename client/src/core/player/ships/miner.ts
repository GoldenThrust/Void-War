
import { assets } from "../../assets/main.ts";
import Mine from "../../weapons/mine.ts";
import { wrap } from "../../world/utils.ts";
import { world } from "../../world/world.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";

export default class Miner extends Ship {
    constructor(prop: ShipC) {
        super({ ...prop, x: prop.x ?? 10, y: prop.y ?? 20, width: 52, height: 52, angle: prop.angle ?? 0, acceleration: 530, color: "azure", vertices: shapes[5], name: "Miner Drone", maxWeaponHeat: 900, life: 220, weapon: Mine, img: assets?.images?.minership, flameImg: assets?.images?.flame4, friend: prop.friend ?? false });
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    update(t: number, dt: number) {
        super.update(t, dt);
        const tactics = this.tacticalUpdate({ idealRange: 1700, fleeRange: 850, fireRange: 2800, fireArc: Math.PI / 3, orbit: 0.35, fire: false });
        if (!this.target || !tactics || tactics.distance > 3200 || !this.canFire()) return;

        const mineDistance = 300;
        const mineX = wrap(this.target.x - Math.sin(this.target.angle) * mineDistance, world.width);
        const mineY = wrap(this.target.y - Math.cos(this.target.angle) * mineDistance, world.height);
        this.fireFrom(mineX, mineY, this.target.angle);
    }
}