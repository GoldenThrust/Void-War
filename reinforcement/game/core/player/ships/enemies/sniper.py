from __future__ import annotations

from core.assets.main import assets
from core.player.ships.enemies.enemy import EnemyShip
from core.player.ships import player
from core.player.ships.shapes import shapes
from core.weapons.heavy_rail_gun import HeavyRailGun
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class Sniper(EnemyShip):
    def __init__(self, x=10, y=20, angle=0):
        super().__init__(
            x=x,
            y=y,
            width=50,
            height=50,
            angle=angle,
            acceleration=1200,
            color="red",
            vertices=shapes[3],
            name="Sniper",
            maxWeaponHeat=20000,
            life=100,
            weapon=HeavyRailGun,
            img=getattr(getattr(assets, "images", None), "snipership", None),
            flameImg=getattr(getattr(assets, "images", None), "flame1", None),
        )
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    def update(self, t, dt, thrust=0, turn=0):
        updateWrapped(
            fn=lambda *_: self._update(t, dt, thrust=thrust, turn=turn),
            x=self.x,
            y=self.y,
            margin={"width": 5000, "height": 5000},
        )

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        dist = toroidalDistance(self.x, self.y, player.ship.x, player.ship.y)
        self.AI(
            idleDistance=dist > 11**11,
            fleeCondition=dist < 150000,
            seekCondition=(self.state == "flee" and dist > 8**10)
            or self.state != "flee",
            fireCondition={
                "func": lambda delta: abs(delta) < np.pi / 32,
                "others": dist < 10000000,
            },
        )
