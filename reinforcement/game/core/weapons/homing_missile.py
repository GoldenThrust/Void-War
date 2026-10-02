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
            "acceleration": 500,
            "x": options.get("x"),
            "y": options.get("y"),
            "width": 15,
            "height": 50,
            "angle": options.get("angle"),
            "damage": 180,
            "range": 40000,
            "fireRate": 0.12,
            "energyCost": 900,
            "ship": options.get("ship"),
            "color": options.get("color"),
            "img": options.get("img"),
        }
        super().__init__(defaults, force)
        self.target = None
        self.turnRate = 2

    def trackEnemy(self, dt):
        if (
            not self.target
            or getattr(self.target, "state", None) == "dead"
            or self.target.life <= 0
        ):
            return
        dx = toroidalDelta(self.x, self.target.x, world.width)
        dy = toroidalDelta(self.y, self.target.y, world.height)
        target_angle = np.arctan2(-dx, -dy)
        diff = np.arctan2(np.sin(target_angle - self.angle), np.cos(target_angle - self.angle))
        self.angle += clamp(diff, -self.turnRate * dt, self.turnRate * dt)

    def update(self, t, dt):
        self.trackEnemy(dt)
        super().update(t, dt)

    def closeObject(self, obj):
        from core.world.object.asteroid.asteroid import Asteroid

        if isinstance(obj, Asteroid) or (
            hasattr(obj, "friend") and obj.friend == self.ship.friend
        ):
            return
        targetDistance = toroidalDistance(self.target.x, self.target.y, self.x, self.y) if self.target else float("inf")
        newDistance = toroidalDistance(obj.x, obj.y, self.x, self.y)
        if targetDistance > newDistance:
            self.target = obj
