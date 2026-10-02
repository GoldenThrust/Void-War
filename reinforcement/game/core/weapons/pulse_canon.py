from __future__ import annotations

from core.weapons.projectile import Projectile


class PulseCanon(Projectile):
    def __init__(self, options, force=False):
        defaults = {
            "name": "Pulse Canon",
            "speed": options.get("speed", 10),
            "acceleration": 50000,
            "x": options.get("x"),
            "y": options.get("y"),
            "width": 8,
            "height": 15,
            "angle": options.get("angle"),
            "damage": 35,
            "range": 10000,
            "fireRate": 0.5,
            "energyCost": 80,
            "ship": options.get("ship"),
            "color": options.get("color"),
            "img": options.get("img"),
        }
        super().__init__(defaults, force)
