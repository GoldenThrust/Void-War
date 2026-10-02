import { randomNum } from "../utils/random.ts";
import { world } from "../world/world.ts";
import Ship from "../ships/ship.ts";
import Perk from "./perk.ts";
import shapes from "./shapes.ts";

export default class Teleporter extends Perk {
  constructor(prop: PerkC) {
    super({ ...prop, name: "Teleporter", vertices: shapes[2]! });
  }

  protected override colide(ship: Ship) {
    super.colide(ship);
    ship.x = randomNum(0, world.width);
    ship.y = randomNum(0, world.height);
  }
}
