from __future__ import annotations

import numpy as np
from core.weapons.projectile import Projectile


class GatlingGun(Projectile):
    def __init__(self, **options):
        options.update(name="Gatling Gun", x= options.get("x", 0), y= options.get("y", 0), speed=10, acceleration=50000, width=8, height=15, angle=options.get("angle", 0), damage=10, range=8000, fireRate=4, energyCost=20, ship=options.get("ship"), color=options.get("color"))
        super().__init__(**options)

    def update(self, t, dt):
        self.angle += np.random.uniform(-0.005, 0.005)
        super().update(t, dt)
