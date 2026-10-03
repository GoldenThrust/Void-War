import type Ship from "../player/ships/ship";
import { randomNum } from "../utils/random";
import { world } from "../world/world";
import Perk from "./perk";
import shapes from "./shapes";

export default class Teleporter extends Perk {
  constructor(prop: SuperDashC) {
    prop.name = "Teleporter";
    prop.vertices = shapes[2];
    prop.color = "#ffb347";
    super(prop as PerkC);
  }

  colide(ship: Ship): void {
    super.colide(ship);
    ship.x = randomNum(0, world.width);
    ship.y = randomNum(0, world.height);
    ship.angle = randomNum(-Math.PI * 2, Math.PI * 2);
  }
}
