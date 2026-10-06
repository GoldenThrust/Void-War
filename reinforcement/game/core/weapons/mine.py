from __future__ import annotations

import numpy as np
from core.weapons.shapes import shapes
from core.weapons.manager import WeaponManager
from core.weapons.minature import Minature
from core.weapons.weapon import Weapon


class Mine(Weapon):
    def __init__(self, **options):
        options.update(name="Mine", x= options.get("x", 0), y= options.get("y", 0), speed=10, acceleration=10000, width=20, height=20, angle=options.get("angle", 0), damage=300, range=1400, fireRate=0.15, energyCost=400, ship=options.get("ship"), color=options.get("color"), vertices=shapes[1])

        super().__init__(options)
        self.duration = 10000

    def update(self, t, dt):
        self.colliding()
        self.duration -= 1
        if self.duration <= 0:
            self.destroy()
            self.explode(10, 1000)

    def explode(self, particles=50, radius=1000):
        if not self.active:
            return
        for _ in range(particles):
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

    def colide(self):
        self.explode()
