from __future__ import annotations

from core.weapons.projectile import Projectile


class HeavyRailGun(Projectile):
    def __init__(self, **options):
        options.update(name="Heavy RailGun", x= options.get("x", 0), y= options.get("y", 0), speed=options.get("speed", 10) * 5, acceleration=50000, width=10, height=70, angle=options.get("angle", 0), damage=450, range=30000, fireRate=0.08, energyCost=1100, penetration=2, ship=options.get("ship"), color=options.get("color"))

        super().__init__(**options)
