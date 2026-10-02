from __future__ import annotations

from core.weapons.projectile import Projectile


class HeavyRailGun(Projectile):
    def __init__(self, options, force=False):
        defaults = {
            "name": "Heavy RailGun",
            "speed": options.get("speed", 10) * 5,
            "acceleration": 50000,
            "x": options.get("x"),
            "y": options.get("y"),
            "width": 10,
            "height": 70,
            "angle": options.get("angle"),
            "damage": 450,
            "range": 30000,
            "fireRate": 0.08,
            "energyCost": 1100,
            "penetration": 2,
            "ship": options.get("ship"),
            "color": options.get("color"),
            "img": options.get("img"),
        }
        super().__init__(defaults, force)
