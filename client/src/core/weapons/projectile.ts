import { DAMPSPEED } from "../utils/constants.ts";
import { wrap } from "../world/utils.ts";
import { world } from "../world/world.ts";
import { shapes } from "./shapes.ts";
import Weapon from "./weapon.ts";

export default class Projectile extends Weapon {
  constructor(prop: WeaponC) {
    super({
      ...prop,
      name: prop.name,
      type: "projectile",
      x: prop.x,
      y: prop.y,
      width: prop.width,
      height: prop.height,
      acceleration: prop.acceleration,
      speed: prop.speed,
      angle: prop.angle,
      damage: prop.damage,
      range: prop.range,
      energyCost: prop.energyCost,
      fireRate: prop.fireRate,
      ship: prop.ship,
      vertices: prop.vertices ?? shapes[0],
      color: prop.color ?? "red",
      img: prop.img,
      penetration: prop.penetration ?? 1,
    });
  }

  update(_: number, dt: number) {
    this.speed += this.acceleration * dt;

    this.speed = Math.max(this.speed * DAMPSPEED, 0);

    this.x = wrap(
      this.x - Math.sin(this.angle) * (this.speed * dt),
      world.width,
    );
    this.y = wrap(
      this.y - Math.cos(this.angle) * (this.speed * dt),
      world.height,
    );

    this.distanceTraveled += this.speed * dt;

    if (this.distanceTraveled >= this.range) {
      this.travelEnd();
      this.destroy();
    }

    this.colliding();
  }
}
