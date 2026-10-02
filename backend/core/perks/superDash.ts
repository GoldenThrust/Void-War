import Ship from "../ships/ship.ts";
import Perk from "./perk.ts";
import shapes from "./shapes.ts";

export default class SuperDash extends Perk {
  private previousSpeed = 0;
  private multiplier: number;

  constructor(prop: PerkC) {
    super({ ...prop, name: "Super Dash", vertices: shapes[0]! });
    this.multiplier = prop.multiplier ?? 1;
  }

  protected override colide(ship: Ship) {
    super.colide(ship);
    this.previousSpeed = ship.speed;
    ship.speed *= this.multiplier;
  }

  protected override finishedRunning() {
    if (this.getShip()) this.getShip()!.speed = this.previousSpeed;
    super.finishedRunning();
  }
}
