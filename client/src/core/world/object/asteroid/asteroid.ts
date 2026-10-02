import { randomNum } from "../../../utils/random.ts";
import { world } from "../../world.ts";
import { ctx } from "../../canvas.ts";
import { drawWrapped, worldToScreen, wrap } from "../../utils.ts";
import {
  createVerticesPath,
  drawVerticesPath,
  tranformVertices,
} from "../../../utils/vertices.ts";
import { shapes } from "./shapes.ts";
import { FIXED_DT, sizeOf } from "../../../utils/constants.ts";
import { v4 as uuid } from "uuid";

export default class Asteroid {
  public id;
  public x;
  public y;
  public width;
  public height;
  public speed;
  public angle;
  public rotationSpeed;
  private vertices;
  private path2D;
  static asteroids: Map<string, Asteroid> = new Map();

  constructor() {
    this.id = uuid();
    this.x = randomNum(0, world.width);
    this.y = randomNum(0, world.height);
    this.width = randomNum(1, 50);
    this.height = randomNum(1, 50);
    this.speed = randomNum(-8, 8);
    this.rotationSpeed = randomNum(-0.001, 0.001);
    this.angle = randomNum(-Math.PI, Math.PI);
    this.vertices = shapes[Math.floor(Math.random() * shapes.length)];
    this.path2D = createVerticesPath(
      tranformVertices(
        this.vertices,
        0,
        0,
        this.width,
        this.height,
        this.angle,
      ),
    );
  }

  init({
    x,
    y,
    angle,
    width,
    height,
    speed,
    rotationSpeed,
    vertices,
  }: {
    x: number;
    y: number;
    angle: number;
    width: number;
    height: number;
    speed: number;
    rotationSpeed: number;
    vertices: {
      x: number;
      y: number;
    }[];
  }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.rotationSpeed = rotationSpeed;
    this.angle = angle;
    this.vertices = vertices;
    this.path2D = createVerticesPath(
      tranformVertices(
        this.vertices,
        0,
        0,
        this.width,
        this.height,
        this.angle,
      ),
    );
  }

  static init() {
    for (let i = 0; i < sizeOf.asteroid; i++) {
      const asteroid = new Asteroid();
      Asteroid.asteroids.set(asteroid.id, asteroid);
    }
  }

  update(dt: number) {
    this.x = wrap(this.x + this.speed * dt, world.width);
    this.y = wrap(this.y + this.speed * dt, world.height);

    this.angle = wrap(this.angle + this.rotationSpeed, Math.PI * 2);
  }

  render() {
    drawWrapped({
      fn: () => {
        ctx.rotate(-this.angle);
        drawVerticesPath(this.path2D, "#65727a");
      },
      x: this.x,
      y: this.y,
    });
  }

  static render() {
    for (const asteroid of Asteroid.asteroids.values()) {
      asteroid.render();
    }
  }

  static update() {
    for (const asteroid of Asteroid.asteroids.values()) {
      asteroid.update(FIXED_DT);
    }
  }

  destroy() {
    Asteroid.asteroids.delete(this.id);
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
}
