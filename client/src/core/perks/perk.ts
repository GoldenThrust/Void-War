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
  public color: string;
  public vertices;
  private path2D;
  protected ship: Ship | null = null;
  public duration;
  public startTime?: number;
  
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
        const pulse = 0.75 + Math.sin(performance.now() * 0.004) * 0.25;
        ctx.save();
        ctx.rotate(-this.angle);
        ctx.globalCompositeOperation = "lighter";
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 18 * pulse;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          Math.max(this.width, this.height) * pulse,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        drawVerticesPath(this.path2D, this.color);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.stroke(this.path2D);
        ctx.restore();
      },
      x: this.x,
      y: this.y,
    });
  }

  update(t: number) {
    this.nearBy();
    if (!this.ship) return;
    if (!this.startTime) this.startTime = t;
    if (t - this.startTime > this.duration) this.finishedRunning();
  }

  nearBy(radius?: number) {
    if (this.ship) return;
    const object = spatial.query(this.x, this.y, radius);

    for (const element of object) {
      if (!(element instanceof Ship)) continue;

      if (
        isSeperatingAxes(element.getVertices(), this.getVertices()).collision &&
        gameType === "offline"
      ) {
        this.colide(element);
      }
    }
  }

  get getShip() {
    return this.ship;
  }

  set setShip(ship: Ship | null) {
    this.ship = ship;
  }

  colide(ship: Ship) {
    this.ship = ship;

    // console.log("collision between", this.name, "and", ship.name)
  }

  finishedRunning() {
    PerkManager.perks.delete(this.id);
  }
}
