import { randomNum } from "../utils/random";
import { world } from "../world/world";
import type Perk from "./perk";
import Shield from "./shield";
import SuperDash from "./superDash";
import Teleporter from "./teleporter";

export default class PerkManager {
  static perks: Map<string, Perk> = new Map();
  static types = [SuperDash, Teleporter, Shield];
  static spawn() {
    for (let i = 0; i < 200; i++) {
      // const perk = new this.types[2]!({
      const perk = new this.types[Math.floor(randomNum(0, this.types.length))]!({
        x: randomNum(0, world.width),
        y: randomNum(0, world.height),
        angle: randomNum(-Math.PI * 2, Math.PI * 2),
        duration: randomNum(2000, 10000),
        multiplier: randomNum(1.5, 5),
      });

      PerkManager.perks.set(perk.id, perk);
    }
  }

  static render() {
    for (const perk of PerkManager.perks.values()) {
      perk.render();
    }
  }

  static update(t: number) {
    for (const perk of PerkManager.perks.values()) {
      perk.update(t);
    }
  }
}
