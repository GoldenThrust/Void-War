import Ship from "../ships/ship.ts";
import { isSeperatingAxes } from "../utils/collision.ts";
import { DAMPSPEED, FIXED_DT } from "../utils/constants.ts";
import { tranformVertices } from "../utils/vertices.ts";
import { spatial } from "../world/spatialHash.ts";
import WeaponManager from "./manager.ts";

import { shapes } from "./shapes.ts";

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
  public damage;
  public range;
  public fireRate;
  public energyCost;
  public ship;
  public active;
  public penetration;
  public distanceTraveled;

  public color: string;
  protected img;
  protected dampSpeed;
  public vertices;

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
    vertices = shapes[0]!,
    color = "rgb(122,0,0)",
    img,
    penetration = 0,
  }: WeaponC) {
    const currentShipAcceleration =
      (ship.maxSpeed * (1 - DAMPSPEED)) / (DAMPSPEED * FIXED_DT);
    this.id = crypto.randomUUID();
    this.name = name;
    this.type = type;
    this.acceleration = currentShipAcceleration + acceleration;
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

    this.dampSpeed = DAMPSPEED;
    this.active = true;
    this.penetration = penetration;
    this.distanceTraveled = 0;

    if (true) {
      ship.increaseHeat(this.energyCost);
      ship.setCoolDown(1 / this.fireRate);
    }
  }

  destroy() {
    if (!this.active) return;
    this.active = false;
    WeaponManager.destroy(this);
  }

  getVertices() {
    const vertices = tranformVertices(
      this.vertices,
      this.x,
      this.y,
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
    radius?: number
  ) {
    const object = spatial.query(x, y, radius);

    for (const element of object) {
      if (
        (element instanceof Ship &&
          (
            // weapon.ship === element
            //  ||
            weapon.ship.friend === element.friend ||
            element.state === "dead")) ||
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
            // Todo: check if it is friendly fire
            weapon.ship.killScore++;
          }
        } else {
          element.destroy();
        }

        weapon.acceleration *= 0.8;
        weapon.range *= 0.8;

        // console.log(
        //   "Collision detected between",
        //   weapon.name,
        //   "and",
        //   element.name,
        //   !--weapon.penetration,
        //   weapon.penetration,
        // );

        if (--weapon.penetration <= 0) {
          weapon.colide();
          weapon.destroy();
        }
      }
    }
  }

  getNearPlayers(radius?: number) {
    const objects = spatial.query(this.x, this.y, radius);

    const players: Ship[] = [];

    for (const obj of objects) {
      if (obj instanceof Ship
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

  update(t: number, dt: number) {
    if (false) console.log(t, dt);
  }
  colide() {}
  travelEnd() {}
  closeObject(_: any) {}
}
