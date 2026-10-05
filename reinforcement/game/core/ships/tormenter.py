from __future__ import annotations

from core.assets.main import assets
from reinforcement.game.core.ships.enemy import EnemyShip
from reinforcement.game.core.ships import player
from reinforcement.game.core.ships.shapes import shapes
from core.weapons.gatling_gun import GatlingGun
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class Tormenter(EnemyShip):
    def __init__(self, x=10, y=20, angle=0):
        super().__init__(
            x=x,
            y=y,
            width=50,
            height=40,
            angle=angle,
            acceleration=440,
            color="pink",
            vertices=shapes[2],
            name="Tormenter Drone",
            maxWeaponHeat=1200,
            life=140,
            weapon=GatlingGun,
            img=getattr(getattr(assets, "images", None), "tormentership", None),
            flameImg=getattr(getattr(assets, "images", None), "flame6", None),
        )
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    def update(self, t, dt, thrust=0, turn=0):
        self._update(t, dt, thrust=thrust, turn=turn)

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        self.tacticalUpdate(
            idealRange=950,
            fleeRange=300,
            fireRange=3800,
            fireArc=np.pi / 36,
            orbit=0.45,
            lead=0.8,
            turnMultiplier=2,
            threatRange=850,
        )
