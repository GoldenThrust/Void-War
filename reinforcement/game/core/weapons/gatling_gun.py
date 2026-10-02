from __future__ import annotations

import numpy as np
from core.weapons.projectile import Projectile


class GatlingGun(Projectile):
    def __init__(self, options, force=False):
        defaults = {
            "name": "Gatling Gun",
            "speed": options.get("speed", 10),
            "acceleration": 50000,
            "x": options.get("x"),
            "y": options.get("y"),
            "width": 8,
            "height": 15,
            "angle": options.get("angle"),
            "damage": 10,
            "range": 8000,
            "fireRate": 4,
            "energyCost": 20,
            "ship": options.get("ship"),
            "color": options.get("color"),
            "img": options.get("img"),
        }
        super().__init__(defaults, force)

    def update(self, t, dt):
        self.angle += np.random.uniform(-0.005, 0.005)
        super().update(t, dt)
