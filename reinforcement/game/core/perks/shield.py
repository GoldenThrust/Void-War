from __future__ import annotations

from core.utils.math import clamp
from core.utils.random import randomNum
from core.weapons.weapon import Weapon
from core.world.spatial_hash import spatial
from core.world.utils import toroidalDistance

from .perk import Perk
from .shapes import shapes


class Shield(Perk):
    radius = 300

    def __init__(self, **options):
        options.update(name="Shield", vertices=shapes[1], duration=20.0, color="#59f0c1")
        super().__init__(**options)

    def checkWeaponCollision(self):
        if self.ship is None:
            return
        for element in spatial.query(self.ship.x, self.ship.y, self.radius):
            if not isinstance(element, Weapon) or element.ship is None:
                continue
            if element.ship.friend == self.ship.friend:
                continue
            if toroidalDistance(element.x, element.y, self.ship.x, self.ship.y) <= self.radius ** 2:
                element.destroy()

    def update(self, now):
        super().update(now)
        self.checkWeaponCollision()