import { randomNum } from "../utils/random.ts";
import { world } from "../world/world.ts";
import Perk from "./perk.ts";
import Shield from "./shield.ts";
import SuperDash from "./superDash.ts";
import Teleporter from "./teleporter.ts";

export default class PerkManager {
  static perks: Map<string, Perk> = new Map();
  static types = [SuperDash, Teleporter, Shield];

  static spawn() {
    if (PerkManager.perks.size > 0) return;

    for (let i = 0; i < 200; i++) {
      const PerkType = this.types[Math.floor(randomNum(0, this.types.length))]!;
      const perk = new PerkType({
        x: randomNum(0, world.width),
        y: randomNum(0, world.height),
        angle: randomNum(-Math.PI * 2, Math.PI * 2),
        duration: randomNum(2000, 10000),
        multiplier: randomNum(1.5, 5),
      });
      PerkManager.perks.set(perk.id, perk);
    }
  }

  static update(t: number) {
    for (const perk of PerkManager.perks.values()) {
      perk.update(t);
    }
  }
}
