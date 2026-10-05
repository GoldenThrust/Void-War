from __future__ import annotations

from .perk import Perk
from .shapes import shapes


class RepairNanites(Perk):
    def __init__(self, **options):
        options.update(name="Repair Nanites", vertices=shapes[1], duration=0.35, color="#9dff78")
        super().__init__(**options)

    def colide(self, ship):
        super().colide(ship)
        maximum_life = getattr(ship, "maxLife", getattr(ship, "fullLife", ship.life))
        ship.life = min(maximum_life, ship.life + maximum_life * 0.35)