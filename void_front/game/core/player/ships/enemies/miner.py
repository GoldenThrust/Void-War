from __future__ import annotations

from game.core.assets.main import assets
from game.core.player.ships.enemies.enemy import EnemyShip
from game.core.player.ships import player
from game.core.player.ships.shapes import shapes
from game.core.utils.math import clamp
from game.core.weapons.mine import Mine
from game.core.world.utils import lerp, toroidalDistance, updateWrapped, wrap
import numpy as np

from game.core.utils.constants import FIXED_DT

class Miner(EnemyShip):
    def __init__(self, x=10, y=20, angle=0):
        super().__init__(
            x=x,
            y=y,
            width=50,
            height=50,
            angle=angle,
            acceleration=1500,
            color="azure",
            vertices=shapes[5],
            name="Miner Drone",
            maxWeaponHeat=100,
            life=300,
            weapon=Mine,
            img=getattr(getattr(assets, "images", None), "minership", None),
            flameImg=getattr(getattr(assets, "images", None), "flame4", None),
        )
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    def closeWeapon(self, weapon, dist, alpha):
        if dist > 7**7:
            return
        if abs(alpha + np.pi / 2) < np.pi / 8:
            self.fire()
        beta = alpha + np.pi / 2
        delta = np.atan2(-np.sin(beta), -np.cos(beta))
        self.angle = wrap(lerp(self.angle, self.angle - clamp(delta, self.turnRate) * FIXED_DT * self.speed_factor, 0.3), np.pi * 2)

    def update(self, t, dt, thrust=0, turn=0):
        updateWrapped(
            fn=lambda *_: self._update(t, dt, thrust=thrust, turn=turn),
            x=self.x,
            y=self.y,
            margin={"width": 4000, "height": 4000},
        )

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        dist = toroidalDistance(self.x, self.y, player.ship.x, player.ship.y)
        self.AI(
            idleDistance=dist > 10**12,
            fleeCondition=self.weaponState == "hot",
            seekCondition=(self.state == "flee" and dist > 10**7)
            or self.state != "flee",
            fireCondition={
                "func": lambda delta: abs(delta + np.pi) < np.pi / 2,
                "others": dist < 500000,
            },
        )
