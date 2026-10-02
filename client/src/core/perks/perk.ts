import { v4 as uuid } from "uuid";
import shapes from "./shapes";
import {
  createVerticesPath,
  drawVerticesPath,
  tranformVertices,
} from "../utils/vertices";
import { drawWrapped, worldToScreen } from "../world/utils";
import { ctx } from "../world/canvas";
import { spatial } from "../world/spatialHash";
import Ship from "../player/ships/ship";
import { isSeperatingAxes } from "../utils/collision";
import { gameType } from "../main";
import PerkManager from "./manager";

export default class Perk {
  public id: string;
  public name: string;
  public x: number;
  public y: number;
  public angle: number;
  public width: number;
  public height: number;
  protected vertices;
  private path2D;
  protected ship: Ship | null = null;
  private duration;
  private startTime?: number;
  constructor({
    name = "Perk",
    x,
    y,
    angle,
    width = 40,
    height = 40,
    vertices = shapes[0],
    duration = 1000
  }: PerkC) {
    this.id = uuid();
    this.name = name;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vertices = vertices;
    this.width = width;
    this.height = height;
    this.path2D = createVerticesPath(
      tranformVertices(this.vertices, 0, 0, this.width, this.height, 0),
    );
    this.duration = duration;
  }

  getVertices() {
    const world = worldToScreen(this.x, this.y);
    const vertices = tranformVertices(
      this.vertices,
      world.x,
      world.y,
      this.width,
      this.height,
      this.angle,
    );

    return vertices;
  }

  render() {
    if (this.ship) return;
    drawWrapped({
      fn: () => {
        ctx.rotate(-this.angle);
        drawVerticesPath(this.path2D, "#d2ff52");
      },
      x: this.x,
      y: this.y,
    });
  }

  update(t: number) {
    this.nearBy();
    if (!this.ship) return;
    if (!this.startTime) this.startTime = t;
    if (t - this.startTime > this.duration) this.finishedRuning();
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

  finishedRuning() {
    PerkManager.perks.delete(this.id);
  }
}
