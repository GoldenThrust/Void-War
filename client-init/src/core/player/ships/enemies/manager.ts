
import { sizeOf } from "../../../utils/constants.ts";
import { randomNum } from "../../../utils/random.ts";
import { world } from "../../../world/world.ts";
import Explosion, { explosions } from "../../prop/explosion.ts";
import { destroyedShips } from "../ship.ts";
import Bomber from "./bomber.ts";
import type EnemyShip from "./enemy.ts";
import FleetDrone from "./fleet.ts";
import Miner from "./miner.ts";
import MissileLaucher from "./missileLaucher.ts";
import Sniper from "./sniper.ts";
import Tormenter from "./tormenter.ts";

export default class EnemyManager {
    static ships: EnemyShip[] = [];
    // static types = [AI];
    static types = [FleetDrone, Tormenter, Sniper, Bomber, Miner, MissileLaucher];

    static init() {
        for (let i = 0; i < sizeOf.ship; i++) {
            EnemyManager.ships.push(new this.types[Math.floor(randomNum(0, this.types.length))]({ x: randomNum(0, world.width), y: randomNum(0, world.height), angle: randomNum(-Math.PI * 2, Math.PI * 2) }));
        }
    }

    static destroy(enemy: EnemyShip) {
        const index = EnemyManager.ships.indexOf(enemy);
        
        if (index > -1) {
            enemy.state = "dead";
            explosions.push(new Explosion(enemy.x, enemy.y));
            destroyedShips.push(EnemyManager.ships.splice(index, 1)[0]);
        }
    }

    static render() {
        for (const ship of EnemyManager.ships) {
            ship.render();
        }
    }

    static update(t: number, dt: number) {
        for (const ship of EnemyManager.ships) {
            ship.update(t, dt);
        }

    }
}