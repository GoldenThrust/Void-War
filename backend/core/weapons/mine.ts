import { toroidalDistance } from "../world/utils.ts";
import { spatial } from "../world/spatialHash.ts";
import { shapes } from "./shapes.ts";
import Weapon, { isShip } from "./weapon.ts";

export default class Mine extends Weapon {
  private duration: number;
  public override explosionRadius: number;
  public override exploding: boolean;
  private explosionMaxRadius: number;
  private readonly damagedShips = new Set<string>();
  constructor(prop: WeaponC) {
    super({
      ...prop,
      name: "Mine",
      speed: prop.speed ?? 10,
      acceleration: 10000,
      x: prop.x,
      y: prop.y,
      width: 20,
      height: 20,
      angle: prop.angle,
      damage: 300,
      range: 1400,
      fireRate: 0.15,
      energyCost: 100,
      ship: prop.ship,
      color: prop.color,
      vertices: shapes[1],
    });

    this.duration = 1000;
    this.explosionRadius = 0;
    this.exploding = false;
    this.explosionMaxRadius = 500;
  }

  override update() {
    if (this.exploding) {
      this.explode();
    } else {
      this.colliding();
      if (!--this.duration) {
        this.destroy();
      }
    }
  }

  override destroy() {
    if (!this.active) return;
    this.exploding = true;
  }

  protected override onRecycle() {
    this.duration = 1000;
    this.explosionRadius = 0;
    this.exploding = false;
    this.damagedShips.clear();
  }

  checkExplosionCollision() {
    for (const ship of spatial.query(this.x, this.y, this.explosionRadius)) {
      if (
        !isShip(ship) ||
        ship.friend === this.ship.friend ||
        ship.state === "dead" ||
        this.damagedShips.has(ship.id) ||
        toroidalDistance(this.x, this.y, ship.x, ship.y) >
          this.explosionRadius * this.explosionRadius
      ) {
        continue;
      }

      ship.hit(this.damage);
      this.damagedShips.add(ship.id);
      if (ship.life <= 0) {
        this.ship.killScore++;
      }
    }
  }

  explode() {
    if (!this.active) return;

    this.checkExplosionCollision();

    if (this.explosionRadius < this.explosionMaxRadius) {
      this.explosionRadius += 5;
    } else {
      this.exploding = false;
      super.destroy();
    }
  }

  override colide() {
    this.explode();
  }
}
