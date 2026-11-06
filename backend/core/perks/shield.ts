import Weapon from "../weapons/weapon.ts";
import { spatial } from "../world/spatialHash.ts";
import { toroidalDistance } from "../world/utils.ts";
import Perk from "./perk.ts";
import shapes from "./shapes.ts";

export default class Shield extends Perk {
  private radius = 300;
  constructor(prop: PerkC) {
    prop.name = "Shield";
    prop.vertices = shapes[1];
    prop.duration = 20000;
    prop.color = "#59f0c1";
    super(prop as PerkC);
  }

  checkWeaponColision() {
    if (!this.ship) return;
    const object = spatial.query(this.ship.x, this.ship.y, this.radius);

    for (const element of object) {
      if (
        !(element instanceof Weapon) || element.ship.friend === this.ship.friend
      )
        continue;

      const distanceSquared = toroidalDistance(
        element.x,
        element.y,
        this.ship.x,
        this.ship.y,
      );
      if (distanceSquared <= this.radius ** 2) {
        element.destroy();
      }
    }
  }

  override update(t: number) {
    super.update(t);
    this.checkWeaponColision();
  }
}
