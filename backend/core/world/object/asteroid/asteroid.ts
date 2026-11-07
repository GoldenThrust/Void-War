import { randomNum } from "../../../utils/random.ts";
import { world } from "../../world.ts";
import { wrap } from "../../utils.ts";
import { tranformVertices } from "../../../utils/vertices.ts";
import { shapes } from "./shapes.ts";
import { FIXED_DT, sizeOf } from "../../../utils/constants.ts";
import { v4 as uuid } from "uuid";

export default class Asteroid {
  public id;
  public x;
  public y;
  public width;
  public height;
  public vx;
  public vy;
  public angle;
  public rotationSpeed;
  public vertices;
  static asteroids: Map<string, Asteroid> = new Map();

  constructor() {
    this.id = uuid();
    this.x = randomNum(0, world.width);
    this.y = randomNum(0, world.height);
    this.width = randomNum(1, 50);
    this.height = randomNum(1, 50);
    this.vx = randomNum(-8, 8);
    this.vy = randomNum(-8, 8);
    this.rotationSpeed = randomNum(-0.001, 0.001);
    this.angle = randomNum(-Math.PI, Math.PI);
    this.vertices = shapes[Math.floor(Math.random() * shapes.length)];
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
    this.vx = speed;
    this.vy = speed;
    this.rotationSpeed = rotationSpeed;
    this.angle = angle;
    this.vertices = vertices;
  }

  static init() {
    for (let i = 0; i < sizeOf.asteroid; i++) {
      const asteroid = new Asteroid();
      Asteroid.asteroids.set(asteroid.id, asteroid);
    }
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, world.width);
    this.y = wrap(this.y + this.vy * dt, world.height);

    this.angle = wrap(this.angle + this.rotationSpeed, Math.PI * 2);
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
}
