import type Ship from "../ships/ship.ts";
import Perk from "./perk.ts";
import shapes from "./shapes.ts";

export default class RepairNanites extends Perk {
  constructor(prop: PerkC) {
    prop.name = "Repair Nanites";
    prop.vertices = shapes[1];
    prop.duration = 350;
    prop.color = "#9dff78";
    super(prop);
  }

  override colide(ship: Ship) {
    super.colide(ship);
    ship.life = Math.min(ship.maxLife, ship.life + ship.maxLife * 0.35);
  }
}
