from __future__ import annotations

from core.assets.main import assets
from reinforcement.game.core.ships.enemy import EnemyShip
from reinforcement.game.core.ships import player
from reinforcement.game.core.ships.shapes import shapes
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
            acceleration=320,
            color="gold",
            vertices=shapes[6],
            name="Missile Launcher",
            maxWeaponHeat=1800,
            life=170,
            weapon=HomingMissile,
            img=getattr(getattr(assets, "images", None), "missilelauchership", None),
            flameImg=getattr(getattr(assets, "images", None), "flame5", None),
        )
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    def update(self, t, dt, thrust=0, turn=0):
        self._update(t, dt, thrust=thrust, turn=turn)

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        self.tacticalUpdate(
            idealRange=4200,
            fleeRange=1200,
            fireRange=10000,
            fireArc=np.pi / 3,
            lead=1.2,
            turnMultiplier=0.8,
        )
