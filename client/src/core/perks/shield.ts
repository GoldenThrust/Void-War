import Weapon from "../weapons/weapon";
import { ctx } from "../world/canvas";
import { spatial } from "../world/spatialHash";
import { drawWrapped, toroidalDistance } from "../world/utils";
import Perk from "./perk";
import shapes from "./shapes";

export default class Shield extends Perk {
  private radius = 300;
  constructor(prop: PerkC) {
    prop.name = "Shield";
    prop.vertices = shapes[1];
    prop.duration = 20000;
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

  render(): void {
    if (this.ship) {
      drawWrapped({
        fn: () => {
          ctx.fillStyle = "#ffffff10";
          ctx.strokeStyle = "springgreen";
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        },
        x: this.ship.x,
        y: this.ship.y,
      });
    }
    super.render();
  }

  update(t: number) {
    super.update(t);
    this.checkWeaponColision();
  }
}
