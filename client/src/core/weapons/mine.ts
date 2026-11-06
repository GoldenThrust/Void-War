import { assets } from "../assets/main.ts";
import { gameType } from "../main.ts";
import Ship from "../player/ships/ship.ts";
import { drawWrapped, toroidalDistance } from "../world/utils.ts";
import { spatial } from "../world/spatialHash.ts";
import { shapes } from "./shapes.ts";
import Weapon from "./weapon.ts";
import { ctx } from "../world/canvas.ts";

export default class Mine extends Weapon {
  private duration: number;
  private explosionRadius: number;
  private exploding: boolean;
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
      img: assets?.images?.mine,
    });

    this.duration = 1000;
    this.explosionRadius = 0;
    this.exploding = false;
    this.explosionMaxRadius = 500;
  }

  render() {
    if (this.exploding) {
      this.renderExplosion();
    } else {
      super.render();
      this.renderArmedGlow();
    }
  }

  private renderArmedGlow() {
    const pulse = 0.5 + Math.sin(performance.now() * 0.006) * 0.5;

    drawWrapped({
      x: this.x,
      y: this.y,
      margin: { width: 120, height: 120 },
      fn: () => {
        const gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, 48);
        gradient.addColorStop(0, `rgba(255, 244, 180, ${0.28 + pulse * 0.2})`);
        gradient.addColorStop(0.35, `rgba(255, 110, 40, ${0.14 + pulse * 0.1})`);
        gradient.addColorStop(1, "rgba(255, 35, 20, 0)");

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 185, 80, ${0.35 + pulse * 0.25})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, 30 + pulse * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      },
    });
  }

  private renderExplosion() {
    const progress = this.explosionRadius / this.explosionMaxRadius;
    const alpha = 1 - progress;

    drawWrapped({
      x: this.x,
      y: this.y,
      margin: { width: this.explosionMaxRadius, height: this.explosionMaxRadius },
      fn: () => {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        const glow = ctx.createRadialGradient(
          0,
          0,
          Math.max(2, this.explosionRadius * 0.12),
          0,
          0,
          this.explosionRadius,
        );
        glow.addColorStop(0, `rgba(255, 255, 220, ${0.9 * alpha})`);
        glow.addColorStop(0.18, `rgba(255, 180, 55, ${0.65 * alpha})`);
        glow.addColorStop(0.72, `rgba(255, 55, 20, ${0.22 * alpha})`);
        glow.addColorStop(1, "rgba(255, 20, 0, 0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, this.explosionRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 235, 160, ${0.9 * alpha})`;
        ctx.lineWidth = 3 + alpha * 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.explosionRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 90, 30, ${0.55 * alpha})`;
        ctx.lineWidth = 1.5;
        for (let index = 0; index < 12; index++) {
          const angle = (index / 12) * Math.PI * 2;
          const inner = this.explosionRadius * 0.72;
          const outer = this.explosionRadius * (0.95 + (index % 2) * 0.08);
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
          ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          ctx.stroke();
        }

        ctx.restore();
      },
    });
  }

  update() {
    if (this.exploding) {
      this.explode();
    } else {
      this.colliding();
      if (!--this.duration) {
        this.destroy();
      }
    }
  }

  destroy() {
    if (!this.active) return;
    this.exploding = true;
  }

  checkExplosionCollision() {
    if (gameType !== "offline") return;

    for (const ship of spatial.query(this.x, this.y, this.explosionRadius)) {
      if (
        !(ship instanceof Ship) ||
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

  colide() {
    this.explode();
  }
}
