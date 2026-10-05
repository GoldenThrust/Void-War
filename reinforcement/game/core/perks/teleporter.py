from __future__ import annotations

from core.utils.random import randomNum
from core.world.world import world

from .perk import Perk
from .shapes import shapes


class Teleporter(Perk):
    def __init__(self, **options):
        options.update(name="Teleporter", vertices=shapes[2], color="#ffb347")
        super().__init__(**options)

    def colide(self, ship):
        super().colide(ship)
        ship.x = randomNum(0, world.width)
        ship.y = randomNum(0, world.height)
        ship.angle = randomNum(-6.283185307179586, 6.283185307179586)