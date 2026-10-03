import type Ship from "../player/ships/ship";
import Perk from "./perk";
import shapes from "./shapes";

export default class RepairNanites extends Perk {
  constructor(prop: PerkC) {
    prop.name = "Repair Nanites";
    prop.vertices = shapes[1];
    prop.duration = 350;
    prop.color = "#9dff78";
    super(prop);
  }

  colide(ship: Ship) {
    super.colide(ship);
    ship.life = Math.min(ship.maxLife, ship.life + ship.maxLife * 0.35);
  }
}
