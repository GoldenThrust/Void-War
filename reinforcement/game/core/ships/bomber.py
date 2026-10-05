from __future__ import annotations

from reinforcement.game.core.ships.enemy import EnemyShip
from reinforcement.game.core.ships import player
from reinforcement.game.core.ships.shapes import shapes
from core.weapons.plasma_canon import PlasmaCanon
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class Bomber(EnemyShip):
    def __init__(self, x=10, y=20, angle=0):
        super().__init__(
            x=x,
            y=y,
            width=56,
            height=56,
            angle=angle,
            acceleration=280,
            color="blue",
            vertices=shapes[4],
            name="Bomber Drone",
            maxWeaponHeat=1800,
            life=240,
            weapon=PlasmaCanon,
        )
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
