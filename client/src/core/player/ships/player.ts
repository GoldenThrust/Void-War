
import { assets } from "../../assets/main.ts";
import { randomNum } from "../../utils/random.ts";
import PulseCanon from "../../weapons/pulseCanon.ts";
import ShipManager from "./manager.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";


export let ship: PlayerShip;

export default class PlayerShip extends Ship {
    constructor({ x, y, width, height, angle, acceleration, color = "red", maxWeaponHeat = 10000 }: ShipC) {
        super({ x, y, width, height, angle, img: assets?.images?.mainship, flameImg: assets?.images?.flame1, acceleration, color, name: "Player", maxWeaponHeat, controllable: true, life: 10000, vertices: shapes[0], weapon: PulseCanon, friend: true });

        // this.audioPlayer = throtlePlayAudio(assets?.audios?.engine, this.audioGain);

        if (this.controllable === false)
            this.state = "idle";
    }

    get heatPercent() {
        return Math.ceil((this.heat / this.maxHeat) * 100)
    }

    update(t: number, dt: number) {
        super.update(t, dt);
    }

    static spawn(x: number, y: number) {
        const angle = randomNum(-Math.PI * 2, Math.PI * 2);
        const spawnDistance = 200000;
        const spawnX = randomNum(x - spawnDistance, x + spawnDistance);
        const spawnY = randomNum(y - spawnDistance, y + spawnDistance);
        ship = new PlayerShip({ x: spawnX, y: spawnY, angle, width: 50, height: 50, color: "#84d0ff", acceleration: 600, maxWeaponHeat: 10000  });
        ShipManager.ships.set("player", ship)
    }
}    


// 600-1500
// 2-4.5