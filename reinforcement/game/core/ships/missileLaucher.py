from __future__ import annotations

from click import option

from core.ships.ship import Ship
from core.ships import player
from core.ships.shapes import shapes
from core.weapons.homing_missile import HomingMissile
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class MissileLaucher(Ship):
    def __init__(self, **options):
        options.update(name="Missile Launcher", vertices=shapes[6], x=options.get("x", 10), y=options.get("y", 20), angle=options.get("angle", 0), width= 50, height= 50, acceleration= 480, color="gold", vertices=shapes[6], maxWeaponHeat= 1800, life= 170, weapon= HomingMissile)
        super().__init__(**options)
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
