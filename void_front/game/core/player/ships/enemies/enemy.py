from __future__ import annotations
from game.core.utils.math import clamp
from game.core.weapons.weapon import Weapon
from game.core.world.spatial_hash import spatial
from game.core.world.utils import lerp, toroidalDirection, toroidalDistance, wrap
from game.core.player.ships import player
from game.core.player.ships.ship import Ship
import numpy as np

from game.core.utils.constants import FIXED_DT


class EnemyShip(Ship):
    def __init__(self, **kwargs):
        state = kwargs.pop("state", "idle")
        super().__init__(**kwargs)
        self.state = state
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 1.2

    def destroy(self):
        from game.core.player.ships.enemies.manager import EnemyManager

        EnemyManager.destroy(self)

    def follow(self, obj):
        tangent = np.pi / 2 if self.state == "flee" else -np.pi / 2
        delta = toroidalDirection(obj.x, obj.y, self.x, self.y, self.angle, tangent)
        self.angle = wrap(lerp(self.angle, self.angle - clamp(delta, self.turnRate) * FIXED_DT * self.speed_factor, 0.9), np.pi * 2)
        return delta

    def closeWeapon(self, weapon, dist, alpha):
        if dist > 7**7:
            return
        if abs(alpha - np.pi / 2) < np.pi / 16:
            self.fire()
        beta = alpha + np.pi / 2
        delta = np.atan2(-np.sin(beta), -np.cos(beta))
        self.angle = wrap(lerp(self.angle, self.angle - clamp(delta, self.turnRate) * FIXED_DT * self.speed_factor, 0.3), np.pi * 2)

    def nearByWeapon(self):
        object_list = spatial.query(
            self.x, self.y, np.ceil(self.height / spatial.cellSize) + 1
        )
        for weapon in object_list:
            if isinstance(weapon, Weapon) and weapon.ship is not self:
                dist = toroidalDistance(weapon.x, weapon.y, self.x, self.y)
                if dist > 8**8:
                    continue
                alpha = toroidalDirection(
                    weapon.x, weapon.y, self.x, self.y, self.angle
                )
                self.closeWeapon(weapon, dist, alpha)

    def update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust, turn)
        if self.state != "AI":
            self.speed = self.speed + (self.acceleration * dt)
            self.nearByWeapon()

    def AI(
        self,
        *,
        idleDistance=None,
        fleeCondition=None,
        seekCondition=None,
        fireCondition=None,
    ):
        if idleDistance:
            self.state = "idle"
            self.acceleration = self.seekAcceleration
        elif fleeCondition:
            self.state = "flee"
            self.acceleration = self.fleeAcceleration
        elif seekCondition:
            self.acceleration = self.seekAcceleration
            self.state = "seek"

        if self.state in ["seek", "flee"]:
            delta = self.follow(player.ship)
            if (
                fireCondition
                and fireCondition.get("others")
                and fireCondition["func"](delta)
            ):
                self.fire()
