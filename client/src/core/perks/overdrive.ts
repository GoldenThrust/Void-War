import type Ship from "../player/ships/ship";
import Perk from "./perk";
import shapes from "./shapes";

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

  colide(ship: Ship) {
    super.colide(ship);
    this.previousAcceleration = ship.acceleration;
    this.previousSpeed = ship.speed;
    ship.acceleration *= 1.7;
    ship.speed *= 1.15;
  }

  finishedRuning() {
    if (this.ship) {
      this.ship.acceleration = this.previousAcceleration;
      this.ship.speed = Math.min(this.ship.speed, this.previousSpeed);
    }
    super.finishedRuning();
  }
}
