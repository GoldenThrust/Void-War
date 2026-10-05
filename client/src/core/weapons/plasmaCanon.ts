import { randomNum } from "../utils/random.ts";
import Projectile from "./projectile.ts";
import WeaponManager from "./manager.ts";
import Minature from "./minature.ts";
import { assets } from "../assets/main.ts";

export default class PlasmaCanon extends Projectile {
  constructor(prop: WeaponC) {
    super({
      ...prop,
      name: prop.name ?? "Plasma Canon",
      speed: prop.speed ?? 100,
      acceleration: prop.acceleration ?? 25000,
      width: prop.width ?? 10,
      height: prop.height ?? 45,
      damage: prop.damage ?? 120,
      range: prop.range ?? 45000,
      fireRate: prop.fireRate ?? 0.15,
      energyCost: prop.energyCost ?? 600,
      img: prop.img ?? assets?.images?.plasma,
    });
  }

  explode(radius = 1000) {
    if (!this.active) return;
    for (let i = 0; i < 10; i++) {
      const prop = {
        x: this.x - Math.sin(this.angle) * this.width,
        y: this.y - Math.cos(this.angle) * this.height,
        angle: this.angle + Math.PI / 8 + randomNum(0, -Math.PI / 4),
        speed: randomNum(this.speed, this.speed/2),
        ship: this.ship,
        range: randomNum(radius * 0.2, radius * 2),
        color: "yellow",
      };

      WeaponManager.fire(Minature, prop);
    }
  }

  travelEnd() {
    this.explode();
  }

  colide() {
    this.explode();
  }

  // update(dt, manager) {
  //     super.update(dt, manager)
  // }
}
