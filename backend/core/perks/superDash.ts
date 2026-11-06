import type Ship from "../player/ships/ship.ts";
import Perk from "./perk.ts";
import shapes from "./shapes.ts";

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

  override colide(ship: Ship): void {
    super.colide(ship);

    if (!this.ship) return;
    this.previousSpeed = ship.speed;
    ship.speed *= this.multiplier;
  }

  override finishedRunning() {
    if (this.ship) this.ship.speed = Math.min(this.ship.speed, this.previousSpeed);
;

    super.finishedRunning();
  }
}
