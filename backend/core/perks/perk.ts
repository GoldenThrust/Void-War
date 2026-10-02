import { isSeperatingAxes } from "../utils/collision.ts";
import { tranformVertices } from "../utils/vertices.ts";
import { spatial } from "../world/spatialHash.ts";
import PerkManager from "./manager.ts";
import Ship from "../ships/ship.ts";
import shapes from "./shapes.ts";

export default class Perk {
  public id: string;
  public name: string;
  public x: number;
  public y: number;
  public angle: number;
  public width: number;
  public height: number;
  protected vertices: Vertices;
  protected ship: Ship | null = null;
  private duration: number;
  private startTime?: number;

  constructor({
    name = "Perk",
    x,
    y,
    angle,
    width = 40,
    height = 40,
    vertices = shapes[0]!,
    duration = 1000,
  }: PerkC) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vertices = vertices;
    this.width = width;
    this.height = height;
    this.duration = duration;
  }

  getVertices() {
    return tranformVertices(
      this.vertices,
      this.x,
      this.y,
      this.width,
      this.height,
      this.angle,
    );
  }

  update(t: number) {
    this.nearBy();
    if (!this.ship) return;
    if (this.startTime === undefined) this.startTime = t;
    if (t - this.startTime > this.duration) this.finishedRunning();
  }

  protected nearBy(radius?: number) {
    if (this.ship) return;
    const perkVertices = this.getVertices();
    for (const object of spatial.query(this.x, this.y, radius)) {
      if (!(object instanceof Ship)) continue;
      if (isSeperatingAxes(object.getVertices(), perkVertices).collision) {
        this.colide(object);
        break;
      }
    }
  }

  getShip() {
    return this.ship;
  }

  protected colide(ship: Ship) {
    this.ship = ship;
  }

  protected finishedRunning() {
    PerkManager.perks.delete(this.id);
  }
}
