import Weapon from "../weapons/weapon.ts";
import { spatial } from "../world/spatialHash.ts";
import { toroidalDistance } from "../world/utils.ts";
import Perk from "./perk.ts";
import shapes from "./shapes.ts";

export default class Shield extends Perk {
  private radius = 300;

  constructor(prop: PerkC) {
    super({ ...prop, name: "Shield", vertices: shapes[1]!, duration: 20000 });
  }

  override update(t: number) {
    super.update(t);
    if (!this.ship) return;

    for (const object of spatial.query(this.ship.x, this.ship.y, this.radius)) {
      if (!(object instanceof Weapon) || object.ship.friend === this.ship.friend) {
        continue;
      }

      if (
        toroidalDistance(object.x, object.y, this.ship.x, this.ship.y) <=
        this.radius ** 2
      ) {
        object.destroy();
      }
    }
  }
}
