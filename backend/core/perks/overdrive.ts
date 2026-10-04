import type Ship from "../ships/ship.ts";
import Perk from "./perk.ts";
import shapes from "./shapes.ts";

export default class Overdrive extends Perk {
  private previousAcceleration = 0;
  private previousSpeed = 0;

  constructor(prop: PerkC) {
    prop.name = "Overdrive";
    prop.vertices = shapes[2];
    prop.duration = 12000;
    prop.color = "#ff4fd8";
    super(prop);
  }

  override colide(ship: Ship) {
    super.colide(ship);
    this.previousAcceleration = ship.acceleration;
    this.previousSpeed = ship.speed;
    ship.acceleration *= 1.7;
    ship.speed *= 1.15;
  }

  override finishedRunning() {
    if (this.ship) {
      this.ship.acceleration = this.previousAcceleration;
      this.ship.speed = Math.min(this.ship.speed, this.previousSpeed);
    }
    super.finishedRunning();
  }
}
