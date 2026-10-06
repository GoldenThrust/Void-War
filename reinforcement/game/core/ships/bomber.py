from __future__ import annotations

from core.ships import player
from core.ships.shapes import shapes
from core.weapons.plasma_canon import PlasmaCanon
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np

from core.ships.ship import Ship

class Bomber(Ship):
    def __init__(self, **options):
        options.update(name="Bomber", vertices=shapes[4], x=options.get("x", 10), y=options.get("y", 20), angle=options.get("angle", 0), width= 56, height= 56, acceleration= 420, color="blue", vertices=shapes[4], maxWeaponHeat= 1800, life= 240, weapon= PlasmaCanon)
        super().__init__(**options)

        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    def update(self, t, dt, thrust=0, turn=0):
        self._update(t, dt, thrust=thrust, turn=turn)

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        self.tacticalUpdate(
            idealRange=1800,
            fleeRange=450,
            fireRange=7000,
            fireArc=np.pi / 10,
            lead=0.35,
        )
