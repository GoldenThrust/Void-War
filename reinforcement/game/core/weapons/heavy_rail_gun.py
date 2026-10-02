from __future__ import annotations

from core.weapons.projectile import Projectile


class HeavyRailGun(Projectile):
    def __init__(self, options, force=False):
        defaults = {
            "name": "Heavy RailGun",
            "speed": options.get("speed", 10) * 4,
            "acceleration": 50000,
            "x": options.get("x"),
            "y": options.get("y"),
            "width": 10,
            "height": 70,
            "angle": options.get("angle"),
            "damage": 1000,
            "range": 100000,
            "fireRate": 0.005,
            "energyCost": 1000,
            "penetration": 5,
            "ship": options.get("ship"),
            "color": options.get("color"),
            "img": options.get("img"),
        }
        super().__init__(defaults, force)
