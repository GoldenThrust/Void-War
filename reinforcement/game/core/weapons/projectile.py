from __future__ import annotations

from core.weapons.weapon import Weapon
from core.world.utils import wrap
from core.world.world import world
import numpy as np

class Projectile(Weapon):
    def __init__(self, **options):
        options.update(type="projectile")
        
        super().__init__(**options)
        self.distanceTraveled = 0
        self.penetration = options.get("penetration", 1)

    def update(self, t, dt):
        self.speed = self.speed + (self.acceleration * dt)
        self.speed *= self.dampSpeed
        self.x = wrap(self.x - np.sin(self.angle) * (self.speed * dt), world.width)
        self.y = wrap(self.y - np.cos(self.angle) * (self.speed * dt), world.height)
        self.distanceTraveled += (self.speed * dt)
        if self.distanceTraveled >= self.range:
            self.travelEnd()
            self.destroy()
        self.colliding()
