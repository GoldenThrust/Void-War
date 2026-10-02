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

  drawPlayerMarker(x: number, y: number, angle: number, size = 1) {
    const dx = this.sx * x;
    const dy = this.sy * y;
    
    drawWrapped({
      fn: () => {
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.rotate(-angle);
        this.ctx.moveTo(0, -size * 2);
        this.ctx.lineTo(size * 1.25, size * 1.5);
        this.ctx.lineTo(0, size);
        this.ctx.lineTo(-size * 1.25, size * 1.5);

        this.ctx.closePath();
        this.ctx.fillStyle = "#d2ff52";
        this.ctx.strokeStyle = "#f4ffd0";
        this.ctx.shadowColor = "#d2ff52";
        this.ctx.shadowBlur = 8;
        this.ctx.fill();
        this.ctx.stroke();
      },
      x: dx,
      y: dy,
      space: this.world,
      screen: this.canvas,
      wCtx: this.ctx,
    });
  }

  drawWeaponMarker(
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
        this.ctx.moveTo(0, -Math.max(height / this.world.height, size * 2));
        this.ctx.lineTo(size, size);
        this.ctx.lineTo(-size, size);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;
        this.ctx.fill();
      },
      x: dx,
      y: dy,
      space: this.world,
      screen: this.canvas,
      wCtx: this.ctx,
    });
  }

  drawShipMarker(x: number, y: number, size = 1, friend = false) {
    const dx = this.sx * x;
    const dy = this.sy * y;

    drawWrapped({
      fn: () => {
        const color = friend ? "#77d9ff" : "#ff526b";
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = "#f1f6e8";
        this.ctx.shadowColor = color;
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

  drawPerkMarker(x: number, y: number, size = 1) {
    const dx = this.sx * x;
    const dy = this.sy * y;

    drawWrapped({
      fn: () => {
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillStyle = "#d2ff52";
        this.ctx.strokeStyle = "#f4ffd0";
        this.ctx.shadowColor = "#d2ff52";
        this.ctx.shadowBlur = 7;
        this.ctx.fillRect(-size, -size, size * 2, size * 2);
        this.ctx.strokeRect(-size, -size, size * 2, size * 2);
      },
      x: dx,
      y: dy,
      space: this.world,
      screen: this.canvas,
      wCtx: this.ctx,
    });
  }

  drawRadarGrid() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.ctx.strokeStyle = "rgba(119, 217, 255, 0.16)";
    this.ctx.lineWidth = 1;
    for (const radius of [this.canvas.width * 0.18, this.canvas.width * 0.34, this.canvas.width * 0.49]) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, 0);
    this.ctx.lineTo(centerX, this.canvas.height);
    this.ctx.moveTo(0, centerY);
    this.ctx.lineTo(this.canvas.width, centerY);
    this.ctx.stroke();
  }

  render() {
    // const captureDuration = 5000;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawRadarGrid();

    this.ctx.save();
    this.ctx.translate(
      (this.canvas.width - this.world.width) / 2,
      (this.canvas.height - this.world.height) / 2,
    );

    const dx = this.sx * ship.x;
    const dy = this.sy * ship.y;

    this.world.x = dx;
    this.world.y = dy;

    this.drawPlayerMarker(ship.x, ship.y, ship.angle, this.canvas.width / 40);

    this.ctx.globalAlpha = 1;
    // this.ctx.globalAlpha = Math.sin((performance.now() % captureDuration) / captureDuration * Math.PI);

    for (const weapon of WeaponManager.weapons.values()) {
      this.drawWeaponMarker(
        weapon.x,
        weapon.y,
        weapon.height,
        weapon.angle,
        1,
        weapon.ship instanceof PlayerShip ? "#f6e58d" : weapon.ship.friend ? "#77d9ff" : "#ff526b",
      );
    }

    for (const otherShip of ShipManager.ships.values()) {
      if (otherShip === ship) continue;
      this.drawShipMarker(otherShip.x, otherShip.y, 1, otherShip.friend);
    }

    for (const perk of PerkManager.perks.values()) {
      this.drawPerkMarker(perk.x, perk.y, 0.75);
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
