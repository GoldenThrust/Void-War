from __future__ import annotations

from core.utils.math import clamp
from core.weapons.plasma_canon import PlasmaCanon
from core.world.utils import toroidalDelta, toroidalDistance, wrap
from core.world.world import world
import numpy as np

class HomingMissile(PlasmaCanon):
    def __init__(self, options, force=False):
        defaults = {
            "name": "Homing Missile",
            "speed": options.get("speed", 10),
            "acceleration": 15000,
            "x": options.get("x"),
            "y": options.get("y"),
            "width": 15,
            "height": 50,
            "angle": options.get("angle"),
            "damage": 5,
            "range": 25000,
            "fireRate": 0.005,
            "energyCost": 1000,
            "ship": options.get("ship"),
            "color": options.get("color"),
            "img": options.get("img"),
        }
        super().__init__(defaults, force)
        self.target = None
        self.turnRate = 0.01

    def trackEnemy(self):
        if not self.target or getattr(self.target, "state", None) == "dead" or self.distanceTraveled <= 200:
            return
        dx = toroidalDelta(self.target.x, self.x, world.width)
        dy = toroidalDelta(self.target.y, self.y, world.height)
        targetAngle = np.atan2(dy, dx)
        diff = (targetAngle + self.angle) + np.pi / 2
        diff = np.atan2(-np.sin(diff), -np.cos(diff))
        self.angle += clamp(diff, self.turnRate)

    def update(self, dt, manager=None):
        self.trackEnemy()
        super().update(dt, manager)

    def closeObject(self, obj):
        from core.world.object.asteroid.asteroid import Asteroid

        if isinstance(obj, Asteroid):
            return
        targetDistance = toroidalDistance(self.target.x, self.target.y, self.x, self.y) if self.target else float("inf")
        newDistance = toroidalDistance(obj.x, obj.y, self.x, self.y)
        if targetDistance > newDistance:
            self.target = obj
