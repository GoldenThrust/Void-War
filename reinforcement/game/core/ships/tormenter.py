from __future__ import annotations

from core.ships.ship import Ship
from core.ships import player
from core.ships.shapes import shapes
from core.weapons.gatling_gun import GatlingGun
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class Tormenter(Ship):
    def __init__(self, **options):
        options.update(name="Tormenter Drone", vertices=shapes[2], x=options.get("x", 10), y=options.get("y", 20), angle=options.get("angle", 0), width= 50, height= 40, acceleration= 560, color="pink", vertices=shapes[2], maxWeaponHeat= 1200, life= 140, weapon= GatlingGun)
        super().__init__(**options)
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
