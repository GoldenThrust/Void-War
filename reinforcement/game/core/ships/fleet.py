from __future__ import annotations

from core.ships.ship import Ship
from core.ships import player
from core.ships.shapes import shapes
from core.weapons.pulse_canon import PulseCanon
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class FleetDrone(Ship):
    next_formation_slot = {False: 0, True: 0}

    def __init__(self, **options):
        options.update(name="Fleet Drone", vertices=shapes[1], x=options.get("x", 10), y=options.get("y", 20), angle=options.get("angle", 0), width= 42, height= 42, acceleration= 620, color="springgreen", vertices=shapes[1], maxWeaponHeat= 1800, life= 280, weapon= PulseCanon)
        super().__init__(**options)
        self.formation_slot = FleetDrone.next_formation_slot[self.friend]
        FleetDrone.next_formation_slot[self.friend] += 1
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    def update(self, t, dt, thrust=0, turn=0):
        self._update(t, dt, thrust=thrust, turn=turn)

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        squad_target = FleetDrone.getSquadTarget(self.friend)
        if squad_target is not None:
            self.target = squad_target
        formation_orbit = 1 if self.formation_slot % 2 == 0 else -1
        formation_range = 1800 + (self.formation_slot % 3) * 350
        self.tacticalUpdate(
            searchRange=16000,
            idealRange=formation_range,
            fleeRange=700,
            fireRange=5000,
            fireArc=np.pi / 32,
            orbit=formation_orbit * 0.65,
            lead=0.2,
        )
        if self.target is not None:
            FleetDrone.setSquadTarget(self.friend, self.target)
