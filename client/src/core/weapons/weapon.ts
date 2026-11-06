import { gameType } from "../main.ts";
import Ship from "../player/ships/ship.ts";
import { circleCollision, isSeperatingAxes } from "../utils/collision.ts";
import {
  DAMPSPEED,
  FIXED_DT,
  WEAPON_FIRE_RATE_MULTIPLIER,
} from "../utils/constants.ts";
import {
  createVerticesPath,
  drawVerticesPath,
  tranformVertices,
} from "../utils/vertices.ts";
import { ctx } from "../world/canvas.ts";
import Asteroid from "../world/object/asteroid/asteroid.ts";
import { spatial } from "../world/spatialHash.ts";
import { drawWrapped, worldToScreen } from "../world/utils.ts";
import Explosion, { explosions } from "../player/prop/explosion.ts";
import WeaponManager from "./manager.ts";

import { shapes } from "./shapes.ts";
import { v4 as uuid } from "uuid";

export default class Weapon implements WeaponI {
  public id: string;
  public name: string;
  public x: number;
  public y: number;
  public type: string;
  public speed: number;
  public acceleration: number;
  public width: number;
  public height: number;
  public angle: number;
  public damage: number;
  public range: number;
  public fireRate: number;
  public energyCost: number;
  public ship: Ship;
  public active: boolean;
  public penetration: number;
  public distanceTraveled: number;

  protected color: string;
  protected img;
  protected vertices;
  protected path2D;

  constructor({
    id = uuid(),
    name = "Weapon",
    type = "Projectile",
    x,
    y,
    width = 25,
    height = 25,
    angle,
    ship,
    acceleration = 10,
    speed = 10,
    damage = 10,
    range = 1000,
    energyCost = 10,
    fireRate = 1,
    vertices = shapes[0],
    color = "rgb(122,0,0)",
    img,
    penetration = 0,
  }: WeaponC) {
    const currentSheepAcceleration =
      (ship.maxSpeed * (1 - DAMPSPEED)) / (DAMPSPEED * FIXED_DT);
    this.id = id;
    this.name = name;
    this.type = type;
    this.acceleration = currentSheepAcceleration + acceleration;
    this.speed = ship.speed + speed;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = angle;
    this.damage = damage;
    this.img = img;

    this.range = range;
    this.fireRate = fireRate;
    this.energyCost = energyCost;

    this.vertices = vertices;

    this.color = color;
    this.ship = ship;

    this.path2D = createVerticesPath(
      tranformVertices(
        this.vertices,
        0,
        -this.height / 2,
        this.width,
        this.height,
        0,
      ),
    );

    this.active = true;
    this.penetration = penetration;
    this.distanceTraveled = 0;

    if (true) {
      ship.increaseHeat(this.energyCost);
      ship.setCoolDown(1 / (this.fireRate * WEAPON_FIRE_RATE_MULTIPLIER));
    }
  }

  render() {
    drawWrapped({
      fn: () => {
        const color = this.ship.friend ? "#54d9ff" : "#ff6938";
        ctx.rotate(-this.angle);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        // ctx.shadowColor = this.color;
        // ctx.shadowBlur = 10;
        if (this.img) {
          ctx.drawImage(
            this.img,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height,
          );
        } else {
          drawVerticesPath(this.path2D, color);
        }
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(0, -this.height * 0.46, this.width * 0.16, this.height * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
      x: this.x,
      y: this.y,
      margin: {
        width: 200,
        height: 200,
      },
    });
  }

  destroy() {
    if (!this.active) return;
    this.active = false;
    WeaponManager.destroy(this);
  }

  getVertices() {
    const world = worldToScreen(this.x, this.y);
    const vertices = tranformVertices(
      this.vertices,
      world.x,
      world.y,
      this.width,
      this.height,
      this.angle,
    );

    return vertices;
  }

  static nearBy(
    weapon: Weapon,
    vertices: {
      x: number;
      y: number;
    }[],
    x: number,
    y: number,
    radius?: number,
  ) {
    if (!weapon.active) return;
    const object = spatial.query(x, y, radius);

    for (const element of object) {
      if (!weapon.active) break;
      if (
        (element instanceof Ship &&
          // weapon.ship === element
          //  ||
          (weapon.ship.friend === element.friend ||
            element.state === "dead")) ||
        (element instanceof Weapon &&
          weapon.ship === element.ship ||
          (
            // weapon.ship.friend === element.ship.friend || 
            weapon === element))
      )
        continue;

      weapon.closeObject(element);
      if (
        isSeperatingAxes(element.getVertices(), vertices).collision
        // circleCollision(this as any, element)
         &&
        gameType === "offline"
      ) {
        explosions.push(
          new Explosion(
            element.x,
            element.y,
            element instanceof Ship ? 34 : 24,
            weapon.ship.friend ? "#54d9ff" : "#ff6938",
            true,
          ),
        );

        if (element instanceof Ship) {
          element.hit(weapon.damage);
          if (element.life <= 0) {
            // Todo: check if it is friendly fire
            weapon.ship.killScore++;
          }
        } else if (element instanceof Weapon || element instanceof Asteroid ) {
          element.destroy();
        }

        weapon.acceleration *= 0.8;
        weapon.range *= 0.8;

        if (--weapon.penetration <= 0) {
          weapon.colide();
          weapon.destroy();
          break;
        }
      }
    }
  }

  getNearPlayers(radius?: number) {
    const objects = spatial.query(this.x, this.y, radius);

    const players: Ship[] = [];

    for (const obj of objects) {
      if (
        obj instanceof Ship
        //  && obj !== this.ship
      ) {
        players.push(obj);
      }
    }
    return players;
  }

  getNearWeapons(radius?: number) {
    const objects = spatial.query(this.x, this.y, radius);

    const weapons: Weapon[] = [];

    for (const obj of objects) {
      if (obj instanceof Weapon && obj !== this) {
        weapons.push(obj);
      }
    }
    return weapons;
  }

  colliding() {
    Weapon.nearBy(this, this.getVertices(), this.x, this.y);
  }

  update(_t: number, _dt: number) {}
  colide() {}
  travelEnd() {}
  closeObject(_: any) {}
}
