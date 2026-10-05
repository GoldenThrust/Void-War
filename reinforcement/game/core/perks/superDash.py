from __future__ import annotations

from .perk import Perk
from .shapes import shapes


class SuperDash(Perk):
    def __init__(self, *, multiplier=1.0, **options):
        options.update(name="Super Dash", vertices=shapes[0], color="#65a7ff")
        super().__init__(**options)
        self.multiplier = multiplier
        self.previous_speed = 0

    def colide(self, ship):
        super().colide(ship)
        self.previous_speed = ship.speed
        ship.speed *= self.multiplier

    def finishedRunning(self):
        if self.ship is not None:
            self.ship.speed = self.previous_speed
        super().finishedRunning()