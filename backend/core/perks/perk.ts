import { v4 as uuid } from "uuid";
import shapes from "./shapes.ts";
import { tranformVertices } from "../utils/vertices.ts";
import { spatial } from "../world/spatialHash.ts";
import Ship from "../player/ships/ship.ts";
import { isSeperatingAxes } from "../utils/collision.ts";
import { gameType } from "../main.ts";
import PerkManager from "./manager.ts";

export default class Perk {
  public id: string;
  public name: string;
  public x: number;
  public y: number;
  public angle: number;
  public width: number;
  public height: number;
  public color: string;
  protected vertices;
  protected ship: Ship | null = null;
  private duration;
  private startTime?: number;
  constructor({
    id = uuid(),
    name = "Perk",
    x,
    y,
    angle,
    width = 40,
    height = 40,
    vertices = shapes[0],
    duration = 1000,
    color = "#d2ff52",
  }: PerkC) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vertices = vertices;
    this.width = width;
    this.height = height;
    this.color = color;
    this.duration = duration;
  }

  getVertices() {
    const vertices = tranformVertices(
      this.vertices!,
      this.x,
      this.y,
      this.width,
      this.height,
      this.angle,
    );

    return vertices;
  }

  update(t: number) {
    this.nearBy();
    if (!this.ship) return;
    if (!this.startTime) this.startTime = t;
    if (t - this.startTime > this.duration) this.finishedRunning();
  }

  nearBy(
    radius?: number,
  ) {
    if (this.ship) return;
    const object = spatial.query(this.x, this.y, radius);

    for (const element of object) {
      if (
        !(element instanceof Ship)
      )
        continue;
        
        if (
          isSeperatingAxes(element.getVertices(), this.getVertices()).collision &&
          gameType === "offline"
        ) {
        this.colide(element);
      }
    }

  }
  
  getShip() {
    return this.ship;
  }

  colide(ship: Ship) {
    this.ship = ship;

    // console.log("collision between", this.name, "and", ship.name)
  }

  finishedRunning() {
    PerkManager.perks.delete(this.id);
  }
}
