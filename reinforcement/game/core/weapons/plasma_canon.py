from __future__ import annotations

import numpy as np
from core.weapons.manager import WeaponManager
from core.weapons.minature import Minature
from core.weapons.projectile import Projectile


class PlasmaCanon(Projectile):
    def __init__(self, options, force=False):
        defaults = {
            "name": "Plasma Canon",
            "speed": options.get("speed", 100),
            "acceleration": options.get("acceleration", 25000),
            "width": options.get("width", 10),
            "height": options.get("height", 45),
            "damage": options.get("damage", 45),
            "range": options.get("range", 50000),
            "fireRate": options.get("fireRate", 0.002),
            "energyCost": options.get("energyCost", 3000),
            "x": options.get("x"),
            "y": options.get("y"),
            "angle": options.get("angle"),
            "ship": options.get("ship"),
            "color": options.get("color"),
            "img": options.get("img"),
        }
        super().__init__(defaults, force)

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
