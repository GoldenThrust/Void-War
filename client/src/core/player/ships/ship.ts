import { ctx } from "../../world/canvas.ts";
import {
  createVerticesPath,
  drawVerticesPath,
  tranformVertices,
} from "../../utils/vertices.ts";
import {
  drawWrapped,
  toroidalDirection,
  toroidalDistance,
  toroidalDelta,
  worldToScreen,
  wrap,
} from "../../world/utils.ts";
import { world } from "../../world/world.ts";
import Trail from "../prop/trail.ts";
import { clamp, lerp } from "../../utils/math.ts";
import { keys } from "../../events/keys.ts";
import { DAMPSPEED, FIXED_DT } from "../../utils/constants.ts";

import WeaponManager from "../../weapons/manager.ts";
import { shapes } from "./shapes.ts";
import PulseCanon from "../../weapons/pulseCanon.ts";
import Weapon from "../../weapons/weapon.ts";
import { spatial } from "../../world/spatialHash.ts";
import ShipManager from "./manager.ts";
// import EngineSound from "../../assets/audio/engine.ts";
// import AudioManager from "../../assets/audio/manager.ts";
import { v4 as uuid } from "uuid";

export default class Ship {
  public id: string;
  public name: string;
  public x: number;
  public y: number;
  public speed: number;
  public acceleration: number;
  public width: number;
  public height: number;
  public angle: number;
  public color: string;
  protected turnRate: number;
  protected img;
  protected flameImg;
  // protected dt;
  protected controllable;
  protected lastTime;
  public weapon;
  public killScore;
  protected vertices;
  protected path2D;
  public life;
  protected fullLife;
  protected cooldown;
  protected heat;
  protected maxHeat;
  protected weaponState;
  protected trail;
  protected speedFactor;
  public state;
  public friend;
  // private engineSound;
  protected seekAcceleration;
  protected fleeAcceleration;
  public target?: Ship;
  protected lastDt = FIXED_DT;
  private targetScanTimer = 0;
  private threatScanTimer = 0;
  private currentThreat?: Threat;
  private static squadTargets = new Map<boolean, Ship>();

  constructor({
    id = uuid(),
    x,
    y,
    width = 40,
    height = 40,
    angle,
    img,
    flameImg,
    weapon = PulseCanon,
    acceleration = 3500,
    life = 100,
    vertices = shapes[0],
    color = "red",
    name = "Player",
    controllable = false,
    maxWeaponHeat = 10000,
    friend = false,
  }: ShipC) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.speed = 0;
    this.acceleration = acceleration;
    this.width = width;
    this.height = height;
    this.angle = angle;
    this.color = color;
    this.turnRate = 2;

    this.name = name;
    this.friend = friend;

    this.img = img;
    this.flameImg = flameImg;
    // this.dt = FIXED_DT;

    this.controllable = controllable;

    this.lastTime = 0;

    this.weapon = weapon;
    this.killScore = 0;

    this.vertices = vertices;

    this.path2D = createVerticesPath(
      tranformVertices(this.vertices, 0, 0, this.width, this.height, 0),
    );

    this.life = life;
    this.fullLife = life;

    this.cooldown = 0;
    this.heat = 0;
    this.maxHeat = maxWeaponHeat;
    this.weaponState = "cool";
    // console.log(this.maxSpeed, this.acceleration, DAMPSPEED, FIXED_DT)
    this.trail = new Trail(
      Math.max(Math.ceil(this.maxSpeed / this.acceleration) * 5, 1),
      "white",
    );
    // console.log("Trail created", this.trail.length)

    this.speedFactor = Math.sqrt(this.speed / (this.maxSpeed || 1));
    this.state = "idle";
    // this.engineSound = new EngineSound(this);
    // AudioManager.set = this.engineSound;
    this.seekAcceleration = this.acceleration;
    this.fleeAcceleration = this.acceleration * 1.2;
  }

  get maxSpeed() {
    return (DAMPSPEED * this.acceleration * FIXED_DT) / (1 - DAMPSPEED)
  }

  get maxLife() {
    return this.fullLife;
  }

  render() {
    ctx.translate(world.width / 2, world.height / 2);
    this.trail.render();
    ctx.translate(-world.width / 2, -world.height / 2);

    drawWrapped({
      fn: () => {
        // draw lifej
        const lifeRatio = clamp(this.life / this.fullLife, 0, 1);
        const color = this.friend ? "#d2ff52" : "#ff526b";
        const segments = 8;
        const gap = 2;
        const segmentWidth = (this.width - gap * (segments - 1)) / segments;

        ctx.fillStyle = "rgba(10, 18, 22, 0.9)";
        ctx.fillRect(-this.width / 2, -this.height - 5, this.width, 5);
        for (let index = 0; index < segments; index++) {
          const segmentStart = index / segments;
          ctx.fillStyle = segmentStart < lifeRatio ? color : "rgba(111, 128, 132, 0.25)";
          ctx.fillRect(
            -this.width / 2 + index * (segmentWidth + gap),
            -this.height - 5,
            segmentWidth,
            3,
          );
        }
        ctx.rotate(-this.angle);

        if (this.img && this.flameImg) {
          ctx.shadowColor = this.friend ? "#d2ff52" : "#ff526b";
          ctx.shadowBlur = 12;
          if (this.speed > 50) {
            ctx.globalAlpha = clamp(this.speed / 200, 0, 1);
            ctx.drawImage(
              this.flameImg,
              -this.width / 2,
              0,
              this.width,
              this.height,
            );
            ctx.globalAlpha = 1;
          }
          ctx.drawImage(
            this.img,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height,
          );
          ctx.shadowBlur = 0;
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

  update(_t: number, dt: number, thrust = 0, turn = 0) {
    this.lastDt = dt;
    let steering = turn;
    const thrusting = this.state === "AI" ? thrust : 1;
    this.speedFactor = clamp(
      Math.sqrt(this.speed / (this.maxSpeed || 1)),
      0,
      1,
    );

    if (this.controllable) {
      if (keys["ArrowLeft"]) {
        // this.angle = wrap(this.angle + 0.01, Math.PI * 2);
        steering = 1;
      }

      if (keys["ArrowRight"]) {
        // this.angle = wrap(this.angle - 0.01, Math.PI * 2);
        steering = -1;
      }

      if (keys["ArrowUp"]) {
        this.speed += this.acceleration * dt;
      }

      if (keys["ArrowDown"]) {
        this.speed -= this.acceleration * dt;
        this.speed = Math.max(this.speed, 0);
      }

      if (keys[" "] || keys["Enter"] || keys["Space"]) {
        this.fire();
      }

    } else if (this.state !== "idle") {
      this.speed += thrusting * this.acceleration * dt;
      this.speed = Math.max(this.speed, 0);
    } else {
      this.speed += this.acceleration * dt;
      // this.speed += this.acceleration * 0.35 * dt;
    }

    this.angle = wrap(
      this.angle + steering * this.turnRate * this.speedFactor * dt,
      // this.angle + steering * this.turnRate * Math.max(this.speedFactor, 0.25) * dt,
      Math.PI * 2,
    );

    this.speed = Math.max(this.speed * DAMPSPEED, 0);

    this.x = wrap(
      this.x - Math.sin(this.angle) * (this.speed * dt),
      world.width,
    );
    this.y = wrap(
      this.y - Math.cos(this.angle) * (this.speed * dt),
      world.height,
    );

    this.trail.update(this.x, this.y, this.speed);

    // weapon update
    if (this.cooldown >= 0) {
      this.cooldown -= dt * 1000;
    }

    this.heat = clamp(this.heat - this.maxHeat * 0.001, 0, this.maxHeat * 5);

    if (this.weaponState === "cool" && this.heat >= this.maxHeat) {
      this.weaponState = "hot";
    } else if (this.weaponState === "hot" && this.heat <= 0) {
      this.weaponState = "cool";
    }

    // this.engineSound.update(x, y);
  }

  canFire() {
    return (
      this.cooldown <= 0 &&
      this.heat < this.maxHeat &&
      this.weaponState === "cool"
    );
  }

  fire() {
    const fireDistance = this.weapon.name === "Mine" ? -100 : 10;
    const fireX = wrap(
      this.x - Math.sin(this.angle) * fireDistance,
      world.width,
    );
    const fireY = wrap(
      this.y - Math.cos(this.angle) * fireDistance,
      world.height,
    );
    this.fireFrom(fireX, fireY, this.angle);
  }

  protected fireFrom(x: number, y: number, angle: number) {
    if (!this.canFire()) return false;

    const prop = {
      x: wrap(x - (Math.sin(angle) * this.width) / 2, world.width),
      y: wrap(y - (Math.cos(angle) * this.height) / 2, world.height),
      angle,
      speed: this.speed,
      ship: this,
      color: this.name === "Player" ? "#33cfff" : "red",
    };

    WeaponManager.fire(this.weapon, prop);
    return true;
  }

  setCoolDown(val: number) {
    this.cooldown = val;
  }

  increaseHeat(val: number) {
    this.heat += val;
  }

  setMaxHeat() {
    this.weaponState = "hot";
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

  destroy() {
    ShipManager.destroy(this);
    // this.engineSound.clean();
  }

  follow(ship: Ship) {
    let tangent;
    if (this.state === "flee") {
      tangent = Math.PI / 2;
    } else {
      tangent = -Math.PI / 2;
    }

    const delta = toroidalDirection(
      ship.x,
      ship.y,
      this.x,
      this.y,
      this.angle,
      tangent,
    );

    this.angle = wrap(
      lerp(
        this.angle,
        this.angle -
          clamp(delta, -this.turnRate, this.turnRate) *
            this.lastDt *
            this.speedFactor,
        0.9,
      ),
      Math.PI * 2,
    );

    return delta;
  }

  closeWeapon(_: Weapon, dist: number, alpha: number) {
    if (dist > 7 ** 7) return;
    if (Math.abs(alpha - Math.PI / 2) < Math.PI / 16) {
      this.fire();
    }

    const beta = alpha + Math.PI / 2;

    const delta = Math.atan2(Math.sin(beta), Math.cos(beta));

    this.angle = wrap(
      lerp(
        this.angle,
        this.angle -
          clamp(delta, -this.turnRate, this.turnRate) *
            this.lastDt *
            this.speedFactor,
        0.3,
      ),
      Math.PI * 2,
    );
  }

  closeEnemy(ship: Ship, _dist: number, _alpha: number) {
    this.target = ship;
  }

  protected static getSquadTarget(friend: boolean) {
    const target = Ship.squadTargets.get(friend);
    if (!target || target.state === "dead" || target.life <= 0) {
      Ship.squadTargets.delete(friend);
      return undefined;
    }
    return target;
  }

  protected static setSquadTarget(friend: boolean, target: Ship) {
    Ship.squadTargets.set(friend, target);
  }

  protected getNearbyAllies(radius?: number) {
    return spatial
      .query(this.x, this.y, radius)
      .filter(
        (object): object is Ship =>
          object instanceof Ship &&
          object.friend === this.friend &&
          object.state !== "dead",
      );
  }

  protected findThreat(radius = 1000) {
    this.threatScanTimer -= this.lastDt;
    if (this.threatScanTimer > 0 && this.currentThreat?.weapon.active) {
      return this.currentThreat;
    }

    this.threatScanTimer = 0.08;
    this.currentThreat = undefined;
    const threats = spatial.query(this.x, this.y, radius);
    let best: Threat | undefined;

    for (const object of threats) {
      if (
        !(object instanceof Weapon) ||
        object.ship === this ||
        !object.active ||
        object.ship.friend === this.friend
      )
        continue;

      const dx = toroidalDelta(object.x, this.x, world.width);
      const dy = toroidalDelta(object.y, this.y, world.height);
      const forwardX = -Math.sin(object.angle);
      const forwardY = -Math.cos(object.angle);
      const forwardDistance = dx * forwardX + dy * forwardY;
      const lateralDistance = Math.abs(dx * forwardY - dy * forwardX);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (object.speed <= 1 || object.name === "Mine") {
        if (distance > 500) continue;
        const threat = {
          weapon: object,
          distance,
          time: distance / Math.max(object.speed, 1),
          lateral: lateralDistance,
        };
        if (!best || threat.time < best.time) best = threat;
        continue;
      }

      const time = forwardDistance / object.speed;
      const collisionRadius = this.width * 0.75 + object.width + 80;
      if (
        forwardDistance <= 0 ||
        time > 1.5 ||
        lateralDistance > collisionRadius
      )
        continue;

      const threat = {
        weapon: object,
        distance,
        time,
        lateral: lateralDistance,
      };
      if (!best || threat.time < best.time) best = threat;
    }

    this.currentThreat = best;
    return this.currentThreat;
  }

  protected evadeThreat(threat: Threat) {
    const forwardX = -Math.sin(threat.weapon.angle);
    const forwardY = -Math.cos(threat.weapon.angle);
    const dx = toroidalDelta(threat.weapon.x, this.x, world.width);
    const dy = toroidalDelta(threat.weapon.y, this.y, world.height);
    const side = dx * forwardY - dy * forwardX >= 0 ? 1 : -1;
    const evadeX = -forwardY * side;
    const evadeY = forwardX * side;
    const evadeAngle = Math.atan2(-evadeX, -evadeY);

    this.state = "evade";
    this.acceleration = this.fleeAcceleration;
    this.steerTo(evadeAngle, 1.5);
  }

  nearByWeapon(radius?: number) {
    const weapons: Weapon[] = spatial.query(this.x, this.y, radius);

    for (const weapon of weapons) {
      if (
        weapon instanceof Weapon &&
        (weapon.ship !== this || weapon.ship.friend !== this.friend)
      ) {
        const dist = toroidalDistance(weapon.x, weapon.y, this.x, this.y);
        if (dist > 8 ** 8) continue;

        const alpha = toroidalDirection(
          weapon.x,
          weapon.y,
          this.x,
          this.y,
          this.angle,
        );

        this.closeWeapon(weapon, dist, alpha);
      }
    }
  }

  nearByTarget(radius?: number) {
    const searchRadius = radius ?? 12000;
    const searchRadiusSquared = searchRadius * searchRadius;
    this.targetScanTimer -= this.lastDt;
    if (
      this.targetScanTimer > 0 &&
      this.target &&
      this.target.state !== "dead" &&
      this.target.life > 0
    )
      return;
    this.targetScanTimer = 0.2;

    if (this.target && this.target.state !== "dead" && this.target.life > 0) {
      const currentDistance = toroidalDistance(
        this.target.x,
        this.target.y,
        this.x,
        this.y,
      );
      if (currentDistance <= searchRadiusSquared * 4) return;
    }

    let closest: Ship | undefined;
    let closestDistance = Infinity;
    for (const candidate of ShipManager.ships.values()) {
      if (
        candidate === this ||
        this.friend === candidate.friend ||
        candidate.state === "dead" ||
        candidate.life <= 0
      )
        continue;
      const dist = toroidalDistance(candidate.x, candidate.y, this.x, this.y);
      if (dist <= searchRadiusSquared && dist < closestDistance) {
        closest = candidate;
        closestDistance = dist;
      }
    }
    if (closest) this.target = closest;
  }

  protected steerTo(angle: number, multiplier = 1) {
    const delta = Math.atan2(
      Math.sin(angle - this.angle),
      Math.cos(angle - this.angle),
    );
    this.angle = wrap(
      this.angle +
        clamp(delta, -this.turnRate * multiplier, this.turnRate * multiplier) *
          this.lastDt,
      Math.PI * 2,
    );
    return delta;
  }

  protected angleToTarget(target: Ship, lead = 0) {
    const dx = toroidalDelta(this.x, target.x, world.width);
    const dy = toroidalDelta(this.y, target.y, world.height);
    const leadX = -Math.sin(target.angle) * target.speed * lead;
    const leadY = -Math.cos(target.angle) * target.speed * lead;
    return Math.atan2(-(dx + leadX), -(dy + leadY));
  }

  protected tacticalUpdate({
    searchRange = 12000,
    idealRange = 2500,
    fleeRange = 0,
    fireRange = 5000,
    fireArc = Math.PI / 12,
    orbit = 0,
    lead = 0,
    turnMultiplier = 1,
    fire = true,
    threatRange = 1000,
  }: ShipTactics = {}) {
    const threat = this.findThreat(threatRange);
    if (threat) {
      this.evadeThreat(threat);
      const threatAngle = Math.atan2(
        -toroidalDelta(this.x, threat.weapon.x, world.width),
        -toroidalDelta(this.y, threat.weapon.y, world.height),
      );
      const aimError = Math.abs(
        Math.atan2(
          Math.sin(threatAngle - this.angle),
          Math.cos(threatAngle - this.angle),
        ),
      );
      if (threat.distance <= 3200 && aimError <= Math.PI / 5)
        this.fireFrom(this.x, this.y, threatAngle);
      return {
        distance: threat.distance,
        targetAngle: threatAngle,
        delta: aimError,
      };
    }

    this.nearByTarget(searchRange);
    if (!this.target || this.target.state === "dead" || this.target.life <= 0) {
      this.target = undefined;
      this.state = "idle";
      this.acceleration = this.seekAcceleration;
      return;
    }
    const distance = Math.sqrt(
      toroidalDistance(this.x, this.y, this.target.x, this.target.y),
    );
    const fleeing = fleeRange > 0 && distance < fleeRange;
    this.state = fleeing ? "flee" : distance > idealRange ? "seek" : "orbit";
    this.acceleration = fleeing ? this.fleeAcceleration : this.seekAcceleration;
    const targetAngle = this.angleToTarget(this.target, lead);
    const firingWindow = fire && !fleeing && distance <= fireRange;
    const steeringAngle = fleeing
      ? targetAngle + Math.PI
      : firingWindow
        ? targetAngle
        : targetAngle + (orbit * Math.PI) / 2;
    const delta = this.steerTo(steeringAngle, turnMultiplier);
    const aimError = Math.abs(
      Math.atan2(
        Math.sin(targetAngle - this.angle),
        Math.cos(targetAngle - this.angle),
      ),
    );
    if (firingWindow && aimError <= fireArc) {
      this.fire();
    }
    return { distance, targetAngle, delta };
  }
}

type Threat = {
  weapon: Weapon;
  distance: number;
  time: number;
  lateral: number;
};

export const destroyedShips: Ship[] = [];

type ShipTactics = {
  searchRange?: number;
  idealRange?: number;
  fleeRange?: number;
  fireRange?: number;
  fireArc?: number;
  orbit?: number;
  lead?: number;
  turnMultiplier?: number;
  fire?: boolean;
  threatRange?: number;
};
