import { world } from "./world.ts";
import { drawWrapped } from "./utils.ts";
import { clamp } from "../utils/math.ts";
import PlayerShip from "../player/ships/player.ts";
import WeaponManager from "../weapons/manager.ts";
import EnemyManager from "../player/ships/enemies/manager.ts";

export default class Minimap {
  public canvas: OffscreenCanvas | null = null;
  public scale: number = 0.7;
  public world: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  public sx: number = 0;
  public sy: number = 0;
  public ctx: OffscreenCanvasRenderingContext2D | null = null;
  public lastTime = 0;

  setProp(
    canvas: OffscreenCanvas,
    scale: number,
  ) {
    this.canvas = canvas;

    const minScale = Math.max(
      canvas.width / world.width,
      canvas.height / world.height,
    );

    this.scale = clamp(scale, minScale, 1);

    this.world = {
      x: 0,
      y: 0,
      width: canvas.width / this.scale,
      height: canvas.height / this.scale,
    };

    this.sx = this.world.width / world.width;
    this.sy = this.world.height / world.height;

    this.ctx = this.canvas.getContext("2d");

    this.lastTime = 0;
  }

  clear() {
    this.canvas!.width = this.canvas!.width;
    this.canvas!.height = this.canvas!.height;
  }

  drawMainShip(x: number, y: number, angle: number, size = 1, color = "red") {
    const dx = this.sx * x;
    const dy = this.sy * y;

    drawWrapped({
      fn: () => {
        if (!this.ctx) return;
      
        this.ctx.beginPath();
        this.ctx.rotate(-angle);
        this.ctx.moveTo(0, -size * 2);
        this.ctx.lineTo(size, size * 2);
        this.ctx.lineTo(0, size / 2);
        this.ctx.lineTo(-size, size * 2);

        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
      },
      x: dx,
      y: dy,
      space: this.world,
      screen: this.canvas as OffscreenCanvas,
      wCtx: this.ctx as OffscreenCanvasRenderingContext2D,
    });
  }

  drawWeapon(
    x: number,
    y: number,
    height: number,
    angle: number,
    size = 1,
    color = "red",
  ) {
    const dx = this.sx * x;
    const dy = this.sy * y;

    drawWrapped({
      fn: () => {
        if (!this.ctx) return;
        this.ctx.rotate(-angle);
        this.ctx.beginPath();
        this.ctx.rect(0, 0, size, -Math.max(height / this.world.height, size));
        this.ctx.fillStyle = color;
        // this.ctx.shadowColor = color;
        // this.ctx.shadowBlur = 10;

        this.ctx.fill();
      },
      x: dx,
      y: dy,
      space: this.world,
      screen: this.canvas as OffscreenCanvas,
      wCtx: this.ctx  as OffscreenCanvasRenderingContext2D,
    });
  }

  draw(x: number, y: number, size = 1, color = "red") {
    const dx = this.sx * x;
    const dy = this.sy * y;

    drawWrapped({
      fn: () => {
        if (!this.ctx) return;

        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;

        this.ctx.fill();
      },
      x: dx,
      y: dy,
      space: this.world,
      screen: this.canvas as OffscreenCanvas,
      wCtx: this.ctx  as OffscreenCanvasRenderingContext2D,
    });
  }

  render() {
      if (!this.ctx || !this.canvas) return;
    // const captureDuration = 5000;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(
      (this.canvas.width - this.world.width) / 2,
      (this.canvas.height - this.world.height) / 2,
    );

    const dx = this.sx * PlayerShip.ship.x;
    const dy = this.sy * PlayerShip.ship.y;

    this.world.x = dx;
    this.world.y = dy;

    this.drawMainShip(
      PlayerShip.ship.x,
      PlayerShip.ship.y,
      PlayerShip.ship.angle,
      this.canvas.width / 40,
      "#84d0ff",
    );
    this.ctx.globalAlpha = 1;
    // this.ctx.globalAlpha = Math.sin((performance.now() % captureDuration) / captureDuration * Math.PI);

    for (const weapon of WeaponManager.weapons) {
      this.drawWeapon(
        weapon.x,
        weapon.y,
        weapon.height,
        weapon.angle,
        1,
        weapon.ship instanceof PlayerShip ? "yellow" : "rgb(255, 0, 0)",
      );
    }

    for (const ship of EnemyManager.ships) {
      this.draw(PlayerShip.ship.x, PlayerShip.ship.y, 1.5, PlayerShip.ship.color);
      // this.draw(ship.x, ship.y, 1.5, `rgb(181, 117, 255)`);
    }
    this.ctx.restore();
  }

  zoom(f = 1) {
    if (!this.canvas) return;
    this.scale = this.scale * f;

    this.world = {
      x: 0,
      y: 0,
      width: this.canvas.width / this.scale,
      height: this.canvas.height / this.scale,
    };

    this.sx = this.world.width / world.width;
    this.sy = this.world.height / world.height;
  }
}

export const minimap = new Minimap();
