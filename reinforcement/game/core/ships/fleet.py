from __future__ import annotations

from reinforcement.game.core.ships.enemy import EnemyShip
from reinforcement.game.core.ships import player
from reinforcement.game.core.ships.shapes import shapes
from core.weapons.pulse_canon import PulseCanon
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class FleetDrone(EnemyShip):
    def __init__(self, x=10, y=20, angle=0):
        super().__init__(
            x=x,
            y=y,
            width=42,
            height=42,
            angle=angle,
            acceleration=520,
            color="springgreen",
            vertices=shapes[1],
            name="Fleet Drone",
            maxWeaponHeat=900,
            life=280,
            weapon=PulseCanon,
        )
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    def update(self, t, dt, thrust=0, turn=0):
        self._update(t, dt, thrust=thrust, turn=turn)

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        self.tacticalUpdate(
            searchRange=16000,
            idealRange=1800,
            fleeRange=700,
            fireRange=5000,
            fireArc=np.pi / 32,
            orbit=0.65,
            lead=0.2,
        )
