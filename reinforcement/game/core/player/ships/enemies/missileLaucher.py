from __future__ import annotations

from core.assets.main import assets
from core.player.ships.enemies.enemy import EnemyShip
from core.player.ships import player
from core.player.ships.shapes import shapes
from core.weapons.homing_missile import HomingMissile
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class MissileLaucher(EnemyShip):
    def __init__(self, x=10, y=20, angle=0):
        super().__init__(
            x=x,
            y=y,
            width=50,
            height=50,
            angle=angle,
            acceleration=800,
            color="gold",
            vertices=shapes[6],
            name="Missile Laucher",
            maxWeaponHeat=3000,
            life=150,
            weapon=HomingMissile,
            img=getattr(getattr(assets, "images", None), "missilelauchership", None),
            flameImg=getattr(getattr(assets, "images", None), "flame5", None),
        )
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

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
            fleeCondition=dist < 80000,
            seekCondition=(self.state == "flee" and dist > 10**7)
            or self.state != "flee",
            fireCondition={
                "func": lambda delta: abs(delta) < np.pi / 2,
                "others": dist < 5000000,
            },
        )
