from __future__ import annotations

import numpy as np
from core.weapons.manager import WeaponManager
from core.weapons.minature import Minature
from core.weapons.projectile import Projectile


class PlasmaCanon(Projectile):
    def __init__(self, **options):
        options.update(name="Plasma Canon", x= options.get("x", 0), y= options.get("y", 0), speed=options.get("speed", 100), acceleration=options.get("acceleration", 25000), width=options.get("width", 10), height=options.get("height", 45), angle=options.get("angle", 0), damage=options.get("damage", 120), range=options.get("range", 45000), fireRate=options.get("fireRate", 0.25), energyCost=options.get("energyCost", 900), ship=options.get("ship"), color=options.get("color"))
        
        super().__init__(options)

    def explode(self, radius=1000):
        if not self.active:
            return
        for _ in range(10):
            prop = {
                "x": self.x - np.sin(self.angle) * self.width,
                "y": self.y - np.cos(self.angle) * self.height,
                "angle": self.angle + np.pi / 8 + np.random.uniform(-np.pi / 4, 0),
                "speed": np.random.uniform(self.speed / 2, self.speed),
                "ship": self.ship,
                "range": np.random.uniform(radius * 0.2, radius * 2),
                "color": "yellow",
            }
            WeaponManager.fire(Minature, prop, True)

    def travelEnd(self):
        self.explode()

    def colide(self):
        self.explode()
