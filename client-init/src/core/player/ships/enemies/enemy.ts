// import EngineSound from "../../../assets/audio/engine.ts";
// import AudioManager from "../../../assets/audio/manager.ts";
import { FIXED_DT } from "../../../utils/constants.ts";
import { clamp, lerp } from "../../../utils/math.ts";
import Weapon from "../../../weapons/weapon.ts";
import { spatial } from "../../../world/spatialHash.ts";
import {
  toroidalDirection,
  toroidalDistance,
  wrap,
} from "../../../world/utils.ts";
import PlayerShip from "../player.ts";

import Ship from "../ship.ts";
import EnemyManager from "./manager.ts";

export default class EnemyShip extends Ship {
  protected seekAcceleration;
  protected fleeAcceleration;
  // public engineSound;
  private aiThrust = 0;
  private aiTurn = 0;
  constructor({
    x,
    y,
    width,
    height,
    angle,
    acceleration,
    life,
    vertices,
    color,
    name,
    controllable,
    weapon,
    maxWeaponHeat,
    img,
    flameImg,
  }: ShipC) {
    super({
      x,
      y,
      width,
      height,
      angle,
      acceleration,
      weapon,
      life,
      vertices,
      color,
      name,
      controllable,
      maxWeaponHeat,
      img,
      flameImg,
    });
    this.seekAcceleration = this.acceleration;
    this.fleeAcceleration = this.acceleration * 1.2;
    // this.engineSound = new EngineSound(this);
    // AudioManager.set = this.engineSound;
  }

  destroy() {
    super.destroy();
    EnemyManager.destroy(this);
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
      PlayerShip.ship.x,
      PlayerShip.ship.y,
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
            FIXED_DT *
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
            FIXED_DT *
            this.speedFactor,
        0.3,
      ),
      Math.PI * 2,
    );
  }

  nearByWeapon() {
    const weapons: Weapon[] = spatial.query(
      this.x,
      this.y,
      500,
    );

    for (const weapon of weapons) {
      if (weapon instanceof Weapon && weapon.ship !== this) {
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

  update(t: number, dt: number, thrust = 0, turn = 0) {
    if (this.state === "AI") {
      thrust = this.aiThrust;
      turn = this.aiTurn;
    }
    super.update(t, dt, thrust, turn);
    if (this.state !== "AI") {
      this.speed = this.speed + this.acceleration * dt;

      this.nearByWeapon();
    }
  }

  setAIAction(thrust: number, turn: number) {
    this.aiThrust = thrust;
    this.aiTurn = turn;
  }

  AI({
    idleDistance,
    fleeCondition,
    seekCondition,
    fireCondition,
  }: Record<string, any>) {
    if (idleDistance) {
      this.state = "idle";
      this.acceleration = this.seekAcceleration;
    } else if (fleeCondition) {
      this.state = "flee";
      this.acceleration = this.fleeAcceleration;
    } else if (seekCondition) {
      this.acceleration = this.seekAcceleration;
      this.state = "seek";
    }

    if (["seek", "flee"].includes(this.state)) {
      const delta = this.follow(PlayerShip.ship);
      if (fireCondition.others && fireCondition.func(delta)) {
        this.fire();
      }
    }
  }
}
