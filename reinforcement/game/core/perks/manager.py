from __future__ import annotations

from core.utils.constants import sizeOf
from core.utils.random import randomNum, randomPick
from core.world.world import world

from .overdrive import Overdrive
from .repairNanites import RepairNanites
from .shield import Shield
from .superDash import SuperDash
from .teleporter import Teleporter


class PerkManager:
    perks = {}
    types = [SuperDash, Teleporter, Shield, RepairNanites, Overdrive]

    @classmethod
    def spawn(cls):
        if cls.perks:
            return
        count = int(getattr(sizeOf, "perk", 0))
        for _ in range(count):
            perk_type = randomPick(cls.types)
            perk = perk_type(
                x=randomNum(0, world.width),
                y=randomNum(0, world.height),
                angle=randomNum(-6.283185307179586, 6.283185307179586),
                duration=randomNum(2.0, 10.0),
                **({"multiplier": randomNum(1.5, 5.0)} if perk_type is SuperDash else {}),
            )
            cls.perks[perk.id] = perk

    @classmethod
    def render(cls):
        for perk in cls.perks.values():
            perk.render()

    @classmethod
    def update(cls, now):
        for perk in list(cls.perks.values()):
            perk.update(now)