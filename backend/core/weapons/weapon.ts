import type Ship from "../player/ships/ship.ts";
import { isSeperatingAxes } from "../utils/collision.ts";
import {
  DAMPSPEED,
  FIXED_DT,
  WEAPON_FIRE_RATE_MULTIPLIER,
} from "../utils/constants.ts";
import { tranformVertices } from "../utils/vertices.ts";
import Asteroid from "../world/object/asteroid/asteroid.ts";
import { spatial } from "../world/spatialHash.ts";
import { destroyWeapon } from "./lifecycle.ts";

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
  protected vertices;
  private readonly speedBonus: number;
  private readonly accelerationBonus: number;
  private readonly initialDamage: number;
  private readonly initialRange: number;
  private readonly initialPenetration: number;

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
    penetration = 0,
  }: WeaponC) {
    const currentSheepAcceleration =
      (ship.maxSpeed * (1 - DAMPSPEED)) / (DAMPSPEED * FIXED_DT);
    this.id = id;
    this.name = name;
    this.type = type;
    this.acceleration = currentSheepAcceleration + acceleration;
    this.speed = ship.speed + speed;
    this.speedBonus = speed;
    this.accelerationBonus = acceleration;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = angle;
    this.damage = damage;
    this.initialDamage = damage;

    this.range = range;
    this.initialRange = range;
    this.fireRate = fireRate;
    this.energyCost = energyCost;

    this.vertices = vertices;

    this.color = color;
    this.ship = ship;

    this.active = true;
    this.penetration = penetration;
    this.initialPenetration = penetration;
    this.distanceTraveled = 0;

    if (true) {
      ship.increaseHeat(this.energyCost);
      ship.setCoolDown(1 / (this.fireRate * WEAPON_FIRE_RATE_MULTIPLIER));
    }
  }

  destroy() {
    if (!this.active) return;
    this.active = false;
    destroyWeapon(this);
  }

  reactivate({ x, y, angle, ship, color }: WeaponC) {
    const currentShipAcceleration =
      (ship.maxSpeed * (1 - DAMPSPEED)) / (DAMPSPEED * FIXED_DT);

    this.x = x;
    this.y = y;
    this.angle = angle;
    this.ship = ship;
    this.color = color ?? this.color;
    this.acceleration = currentShipAcceleration + this.accelerationBonus;
    this.speed = ship.speed + this.speedBonus;
    this.damage = this.initialDamage;
    this.range = this.initialRange;
    this.penetration = this.initialPenetration;
    this.distanceTraveled = 0;
    this.active = true;
    this.onRecycle();

    ship.increaseHeat(this.energyCost);
    ship.setCoolDown(1 / (this.fireRate * WEAPON_FIRE_RATE_MULTIPLIER));
  }

  protected onRecycle() {}

  getVertices() {
    const vertices = tranformVertices(
      this.vertices!,
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
    radius?: number,
  ) {
    if (!weapon.active) return;
    const object = spatial.query(x, y, radius);

    for (const element of object) {
      if (!weapon.active) break;
      if (
        (isShip(element) &&
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
      ) {
        if (isShip(element)) {
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
      if (isShip(obj)) {
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

export function isShip(element: unknown): element is Ship {
  return (
    typeof element === "object" &&
    element !== null &&
    "isShip" in element &&
    element.isShip === true
  );
}
