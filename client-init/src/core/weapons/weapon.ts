import Ship from "../player/ships/ship.ts";
import { isSeperatingAxes } from "../utils/collision.ts";
import {
  createVerticesPath,
  drawVerticesPath,
  tranformVertices,
} from "../utils/vertices.ts";
import { ctx } from "../world/canvas.ts";
import { spatial } from "../world/spatialHash.ts";
import {
  drawWrapped,
  toroidalDistance,
  worldToScreen,
} from "../world/utils.ts";
import WeaponManager from "./manager.ts";

import { shapes } from "./shapes.ts";

export default class Weapon implements WeaponI {
  public name: string;
  public x: number;
  public y: number;
  public type: string;
  public speed: number;
  public acceleration: number;
  public width: number;
  public height: number;
  public angle: number;
  public damage;
  public range;
  public fireRate;
  public energyCost;
  public ship;
  public active;
  public penetration;
  public distanceTraveled;

  protected color: string;
  protected img;
  protected dampSpeed;
  protected vertices;
  protected path2D;

  constructor({
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
    color = "red",
    img,
    penetration = 0,
  }: WeaponC) {
    this.name = name;
    this.type = type;
    this.acceleration = acceleration;
    this.speed = speed;
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

    this.dampSpeed = 0.99;

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
      ship.setCoolDown(1 / this.fireRate);
    }
  }

  render() {
    drawWrapped({
      fn: () => {
        ctx.rotate(-this.angle);
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
          drawVerticesPath(this.path2D, this.color);
        }
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
  ) {
    const object = spatial.query(x, y, 1000);

    for (const element of object) {
      if (
        (element instanceof Ship &&
          (weapon.ship === element || element.state === "dead")) ||
        (element instanceof Weapon &&
          (weapon.ship === element.ship || weapon === element))
      )
        continue;

      weapon.closeObject(element);
      if (isSeperatingAxes(element.getVertices(), vertices).collision) {
        if (element instanceof Ship) {
          element.life = Math.max(0, element.life - weapon.damage);
          if (element.life <= 0) {
            element.destroy();
            weapon.ship.killScore++;
          }
        } else {
          element.destroy();
        }

        weapon.acceleration *= 0.8;
        weapon.range *= 0.8;

        if (!--weapon.penetration) {
          weapon.colide();
          weapon.destroy();
        }
      }
    }
  }

  getNearPlayers(radius: number) {
    const objects = spatial.query(this.x, this.y, 1000);

    const players: Ship[] = [];

    for (const obj of objects) {
      if (obj instanceof Ship && obj !== this.ship) {
        const dist = toroidalDistance(this.x, this.y, obj.x, obj.y);
        if (dist <= radius) {
          players.push(obj);
        }
      }
    }
    return players;
  }

  getNearWeapons(radius: number) {
    const objects = spatial.query(this.x, this.y, 500);

    const weapons: Weapon[] = [];

    for (const obj of objects) {
      if (obj instanceof Weapon && obj !== this) {
        const dist = toroidalDistance(this.x, this.y, obj.x, obj.y);
        if (dist <= radius) {
          weapons.push(obj);
        }
      }
    }
    return weapons;
  }

  colliding() {
    Weapon.nearBy(this, this.getVertices(), this.x, this.y);
  }

  update(t: number, dt: number) {
    if (false) console.log(t, dt);
  }
  colide() {}
  travelEnd() {}
  closeObject(_: any) {}
}
