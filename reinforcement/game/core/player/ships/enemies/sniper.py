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
            acceleration=380,
            color="red",
            vertices=shapes[3],
            name="Sniper",
            maxWeaponHeat=2200,
            life=180,
            weapon=HeavyRailGun,
            img=getattr(getattr(assets, "images", None), "snipership", None),
            flameImg=getattr(getattr(assets, "images", None), "flame1", None),
        )
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    def update(self, t, dt, thrust=0, turn=0):
        self._update(t, dt, thrust=thrust, turn=turn)

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        self.tacticalUpdate(
            idealRange=14000,
            fleeRange=3500,
            fireRange=30000,
            fireArc=np.pi / 40,
            lead=1.5,
            turnMultiplier=0.65,
        )
