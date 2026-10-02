from __future__ import annotations

from core.assets.main import assets
from core.player.ships.enemies.enemy import EnemyShip
from core.player.ships import player
from core.player.ships.shapes import shapes
from core.weapons.pulse_canon import PulseCanon
from core.world.utils import toroidalDistance, updateWrapped
import numpy as np


class FleetDrone(EnemyShip):
    def __init__(self, x=10, y=20, angle=0):
        super().__init__(
            x=x,
            y=y,
            width=40,
            height=40,
            angle=angle,
            acceleration=650,
            color="springgreen",
            vertices=shapes[1],
            name="Fleet Drone",
            maxWeaponHeat=1000,
            life=100,
            weapon=PulseCanon,
            img=getattr(getattr(assets, "images", None), "fleetship", None),
            flameImg=getattr(getattr(assets, "images", None), "flame3", None),
        )
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9

    def update(self, t, dt, thrust=0, turn=0):
        updateWrapped(
            fn=lambda *_: self._update(t, dt, thrust=thrust, turn=turn),
            x=self.x,
            y=self.y,
            margin={"width": 4000, "height": 4000},
        )

    def _update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        dist = toroidalDistance(self.x, self.y, player.ship.x, player.ship.y)
        self.AI(
            idleDistance=dist > 10**10,
            fleeCondition=dist < 80000,
            seekCondition=(self.state == "flee" and dist > 7**7)
            or self.state != "flee",
            fireCondition={
                "func": lambda delta: abs(delta) < np.pi / 8,
                "others": dist < 3000000,
            },
        )
