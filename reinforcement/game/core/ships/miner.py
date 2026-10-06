from __future__ import annotations

from core.ships.ship import Ship
from core.ships import player
from core.ships.shapes import shapes
from core.utils.math import clamp
from core.weapons.mine import Mine
from core.world.utils import lerp, toroidalDistance, updateWrapped, wrap
import numpy as np

from core.utils.constants import FIXED_DT
from reinforcement.game.core.world import world

class Miner(Ship):
    def __init__(self, **options):
        options.update(name="Miner Drone", vertices=shapes[5], x=options.get("x", 10), y=options.get("y", 20), angle=options.get("angle", 0), width= 52, height= 52, acceleration= 530, color="azure", vertices=shapes[5], maxWeaponHeat= 90, life= 220, weapon= Mine)
        super().__init__(**options)
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    # def closeWeapon(self, weapon, dist, alpha):
    #     if dist > 7**7:
    #         return
    #     if abs(alpha + np.pi / 2) < np.pi / 8:
    #         self.fire()
    #     beta = alpha + np.pi / 2
    #     delta = np.atan2(-np.sin(beta), -np.cos(beta))
    #     self.angle = wrap(lerp(self.angle, self.angle - clamp(delta, self.turnRate) * FIXED_DT * self.speed_factor, 0.3), np.pi * 2)

    def update(self, t, dt, thrust=0, turn=0):
        self._update(t, dt, thrust=thrust, turn=turn)

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        tactics = self.tacticalUpdate(
            idealRange=1700,
            fleeRange=850,
            fireRange=2800,
            fireArc=np.pi / 3,
            orbit=0.35,
            fire=False,
        )
        if self.target is not None and tactics and tactics["distance"] <= 3200 and self.canFire():
            mine_distance = 300
            mine_x = wrap(self.target.x - np.sin(self.target.angle) * mine_distance, world.width)
            mine_y = wrap(self.target.y - np.cos(self.target.angle) * mine_distance, world.height)
            self.fireFrom(mine_x, mine_y, self.target.angle)
