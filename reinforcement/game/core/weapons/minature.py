from __future__ import annotations

from core.weapons.projectile import Projectile


class Minature(Projectile):
    def __init__(self, **options):
        options.update(name="Minature", x= options.get("x", 0), y= options.get("y", 0), speed=10, acceleration=10, width=10, height=10, angle=options.get("angle", 0), damage=5, range=options.get("range", 500), fireRate=1, energyCost=0, ship=options.get("ship"), color=options.get("color"))

        super().__init__(options)
