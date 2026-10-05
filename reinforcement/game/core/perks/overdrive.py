from __future__ import annotations

from .perk import Perk
from .shapes import shapes


class Overdrive(Perk):
    def __init__(self, **options):
        options.update(name="Overdrive", vertices=shapes[2], duration=12.0, color="#ff4fd8")
        super().__init__(**options)
        self.previous_acceleration = 0
        self.previous_speed = 0

    def colide(self, ship):
        super().colide(ship)
        self.previous_acceleration = ship.acceleration
        self.previous_speed = ship.speed
        ship.acceleration *= 1.7
        ship.speed *= 1.15

    def finishedRunning(self):
        if self.ship is not None:
            self.ship.acceleration = self.previous_acceleration
            self.ship.speed = min(self.ship.speed, self.previous_speed)
        super().finishedRunning()