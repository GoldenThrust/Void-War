from __future__ import annotations

from dataclasses import dataclass, field

from core.world.canvas import draw_line
from core.world.utils import toroidalDelta
from core.world.world import world


@dataclass
class Trail:
    length: int
    color: str = "blue"
    trails: list[dict] = field(default_factory=list)

    def update(self, x, y, speed):
        if len(self.trails) > self.length:
            self.trails.pop(0)
        self.trails.append({"x": x, "y": y, "speed": speed})

    def render(self):
        if len(self.trails) < 2:
            return
        for i in range(1, len(self.trails)):
            a = self.trails[i - 1]
            b = self.trails[i]
            avgSpeed = (a["speed"] + b["speed"]) / 2
            adx = toroidalDelta(world.x, a["x"], world.width)
            ady = toroidalDelta(world.y, a["y"], world.height)
            bdx = toroidalDelta(world.x, b["x"], world.width)
            bdy = toroidalDelta(world.y, b["y"], world.height)
            if abs(adx - bdx) > avgSpeed or abs(ady - bdy) > avgSpeed:
                continue
            draw_line((adx, ady), (bdx, bdy), color=self.color, width=max(1, int((i / len(self.trails)) * 2)), alpha=max(0, min(255, int((i / len(self.trails)) * 0.1 * 255))))
