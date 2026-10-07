from __future__ import annotations

from core.ships.ship import Ship
from core.ships import player
from core.ships.shapes import shapes
from core.weapons.heavy_rail_gun import HeavyRailGun
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class Sniper(Ship):
    def __init__(self, **options):
        options.update(name="Sniper", vertices=shapes[3], x=options.get("x", 10), y=options.get("y", 20), angle=options.get("angle", 0), width= 50, height= 50, acceleration= 500, color="red",maxWeaponHeat= 2200, life= 180, weapon= HeavyRailGun)
        super().__init__(**options)
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
