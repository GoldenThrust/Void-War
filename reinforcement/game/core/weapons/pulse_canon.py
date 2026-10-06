from __future__ import annotations

from core.weapons.projectile import Projectile


class PulseCanon(Projectile):
    def __init__(self, **options):
        options.update(name="Pulse Canon", x= options.get("x", 0), y= options.get("y", 0), speed=options.get("speed", 10), acceleration=50000, width=8, height=15, angle=options.get("angle", 0), damage=35, range=10000, fireRate=0.5, energyCost=80, ship=options.get("ship"), color=options.get("color"))
       
        super().__init__(options)
