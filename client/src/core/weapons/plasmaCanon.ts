import Projectile from "./projectile.ts";
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
      fireRate: prop.fireRate ?? 0.1,
      energyCost: prop.energyCost ?? 50,
      img: prop.img ?? assets?.images?.plasma,
    });
  }

}
