import { clamp } from "../utils/math.ts";
import { toroidalDelta, toroidalDistance } from "../world/utils.ts";
import { world } from "../world/world.ts";
import PlasmaCanon from "./plasmaCanon.ts";
import Asteroid from "../world/object/asteroid/asteroid.ts";
import { assets } from "../assets/main.ts";
import Ship from "../player/ships/ship.ts";
import Weapon from "./weapon.ts";

export default class HomingMissile extends PlasmaCanon {
  private target: Ship | null;
  private turnRate: number;
  constructor({ x, y, angle, ship, color, speed = 10 }: WeaponC) {
    super({
      name: "Homing Missile",
      speed: speed,
      acceleration: 500,
      x: x,
      y: y,
      width: 15,
      height: 50,
      angle: angle,
      damage: 50,
      range: 50000,
      fireRate: 0.001,
      energyCost: 1000,
      ship,
      color,
      img: assets?.images?.homingmissile,
    });

    this.target = null;
    this.turnRate = 2;
  }

  trackEnemy(dt: number) {
    if (!this.target || this.target.state === "dead" || this.target.life <= 0)
      return;

    // direction to target
    const dx = toroidalDelta(this.x, this.target.x, world.width);
    const dy = toroidalDelta(this.y, this.target.y, world.height);
    const targetAngle = Math.atan2(-dx, -dy);
    const diff = Math.atan2(
      Math.sin(targetAngle - this.angle),
      Math.cos(targetAngle - this.angle),
    );
    this.angle += clamp(diff, -this.turnRate * dt, this.turnRate * dt);
  }

  update(t: number, dt: number) {
    this.trackEnemy(dt);
    super.update(t, dt);
  }

  closeObject(obj: any) {
    if (
      obj instanceof Asteroid ||
      (obj instanceof Ship && obj.friend === this.ship.friend) ||
      (obj instanceof Weapon && obj.ship.friend === this.ship.friend)
    )
      return;
    const targetDistance = this.target
      ? toroidalDistance(this.target.x, this.target.y, this.x, this.y)
      : Infinity;
    const newDistance = toroidalDistance(obj.x, obj.y, this.x, this.y);

    this.target = targetDistance > newDistance ? obj : this.target;
  }
}
