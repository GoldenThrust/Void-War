import { randomNum } from "../../../utils/random.ts";
import { world } from "../../world.ts";
import { worldToScreen, wrap } from "../../utils.ts";
import { sizeOf } from "../../../utils/constants.ts";
import { shapes } from "./shapes.ts";
import { tranformVertices } from "../../../utils/vertices.ts";

export default class Asteroid {
  public id;
  public x;
  public y;
  public width;
  public height;
  public speed;
  public angle;
  public rotationSpeed;
  public vertices;
  
  static asteroids: Map<string, Asteroid> = new Map();


  constructor() {
    this.id = crypto.randomUUID();
    this.x = randomNum(0, world.width);
    this.y = randomNum(0, world.height);
    this.width = randomNum(1, 50);
    this.height = randomNum(1, 50);
    this.speed = randomNum(-8, 8);
    this.rotationSpeed = randomNum(-0.001, 0.001);
    this.angle = randomNum(-Math.PI, Math.PI);
    this.vertices = shapes[Math.floor(Math.random() * shapes.length)]!;
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
