from __future__ import annotations

import numpy as np
from core.weapons.manager import WeaponManager
from core.weapons.minature import Minature
from core.weapons.projectile import Projectile


class PlasmaCanon(Projectile):
    def __init__(self, options, force=False):
        defaults = {
            "name": "Plasma Canon",
            "speed": options.get("speed", 10),
            "acceleration": options.get("acceleration", 25000),
            "width": options.get("width", 10),
            "height": options.get("height", 45),
            "damage": options.get("damage", 10),
            "range": options.get("range", 5000),
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
        for _ in range(100):
            prop = {
                "x": self.x - np.sin(self.angle) * self.width,
                "y": self.y - np.cos(self.angle) * self.height,
                "angle": np.random.uniform(-np.pi, np.pi),
                "speed": np.random.uniform(radius / 2, radius),
                "ship": self.ship,
                "range": np.random.uniform(radius * 0.1, radius / 2),
                "color": "yellow",
            }
            WeaponManager.fire(Minature, prop, True)

    def travelEnd(self):
        self.explode()

    def colide(self):
        self.explode()
