import { world } from "./world.ts";
import { canvas } from "./canvas.ts";
import { drawWrapped } from "./utils.ts";
import { clamp } from "../utils/math.ts";
import PlayerShip, { ship } from "../player/ships/player.ts";
import WeaponManager from "../weapons/manager.ts";
import ShipManager from "../player/ships/manager.ts";
import PerkManager from "../perks/manager.ts";

export default class Minimap {
  public canvas;
  public scale;
  public world;
  public sx;
  public sy;
  public ctx;
  public lastTime;
  public minScale;

  constructor(scale: number) {
    this.canvas = document.querySelector("#minimap") as HTMLCanvasElement;

    const { width, height } = this.canvas.getBoundingClientRect();

    this.canvas.width = width;
    this.canvas.height = height;

    const minScale = Math.max(
      canvas.width / world.width,
      canvas.height / world.height,
    );

    this.minScale = minScale;
    this.scale = clamp(scale, minScale, 1);
    
    this.world = {
      x: 0,
      y: 0,
      width: width / this.scale,
      height: height / this.scale,
    };
    
    this.sx = this.world.width / world.width;
    this.sy = this.world.height / world.height;
    
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.lastTime = 0;
  }

  clear() {
    this.canvas.width = this.canvas.width;
    this.canvas.height = this.canvas.height;
  }

  drawMainShip(x: number, y: number, angle: number, size = 1, color = "red") {
    const dx = this.sx * x;
    const dy = this.sy * y;
    
    drawWrapped({
      fn: () => {
        this.ctx.lineWidth = 2;
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
      screen: this.canvas,
      wCtx: this.ctx,
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
      screen: this.canvas,
      wCtx: this.ctx,
    });
  }

  draw(x: number, y: number, size = 1, color = "red", friend: boolean) {
    const dx = this.sx * x;
    const dy = this.sy * y;

    drawWrapped({
      fn: () => {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = friend ? 'springgreen' : "red";
        this.ctx.shadowColor = friend ? 'springgreen' : "red";
        this.ctx.shadowBlur = 5;

        this.ctx.stroke();
        this.ctx.fill();
      },
      x: dx,
      y: dy,
      space: this.world,
      screen: this.canvas,
      wCtx: this.ctx,
    });
  }

  render() {
    // const captureDuration = 5000;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(
      (this.canvas.width - this.world.width) / 2,
      (this.canvas.height - this.world.height) / 2,
    );

    const dx = this.sx * ship.x;
    const dy = this.sy * ship.y;

    this.world.x = dx;
    this.world.y = dy;

    this.drawMainShip(
      ship.x,
      ship.y,
      ship.angle,
      this.canvas.width / 40,
      "#84d0ff",
    );

    this.ctx.globalAlpha = 1;
    // this.ctx.globalAlpha = Math.sin((performance.now() % captureDuration) / captureDuration * Math.PI);

    for (const weapon of WeaponManager.weapons.values()) {
      this.drawWeapon(
        weapon.x,
        weapon.y,
        weapon.height,
        weapon.angle,
        1,
        weapon.ship instanceof PlayerShip ? "yellow" : weapon.ship.friend ? "blue" : "rgb(255, 0, 0)",
      );
    }

    for (const ship of ShipManager.ships.values()) {
      this.draw(ship.x, ship.y, 1, ship.color, ship.friend);
      // this.draw(ship.x, ship.y, 1.5, `rgb(181, 117, 255)`);
    }

    for (const perk of PerkManager.perks.values()) {
      this.draw(perk.x, perk.y, 0.5, "aliceblue", true);
    }
    this.ctx.restore();
  }

  zoom(f = 1) {
    this.scale = this.scale * f;
    this.scale = clamp(this.scale, this.minScale, 1);


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

export const minimap = new Minimap(0.3);
