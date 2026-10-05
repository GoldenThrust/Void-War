import { wrap } from "../world/utils.ts";
import { world } from "../world/world.ts";
import Weapon from "./weapon.ts";

export default class Projectile extends Weapon {
  constructor(prop: WeaponC) {
    super({
      ...prop,
      type: "projectile",
    });
  }

  override update(_: number, dt: number) {
    super.update(_, dt);
    // if (this.controllable) {
      this.speed += this.acceleration * dt;

      this.speed = Math.max(this.speed * this.dampSpeed, 0);

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
    // }
  }
}
