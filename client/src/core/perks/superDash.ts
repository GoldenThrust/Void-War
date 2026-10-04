import type Ship from "../player/ships/ship";
import Perk from "./perk";
import shapes from "./shapes";

export default class SuperDash extends Perk {
  private previousSpeed: number = 0;
  private multiplier;
  constructor(prop: SuperDashC) {
    prop.name = "Super Dash";
    prop.vertices = shapes[0];
    prop.color = "#65a7ff";
    super(prop as PerkC);
    this.multiplier = prop.multiplier;
  }

  colide(ship: Ship): void {
    super.colide(ship);

    this.previousSpeed = ship.speed;
    ship.speed *= this.multiplier;
  }

  finishedRunning() {
    if (this.ship) this.ship.speed = this.previousSpeed;

    super.finishedRunning();
  }
}
