from __future__ import annotations

from dataclasses import dataclass

from core.utils.constants import worldSize
from .canvas import resizeCanvas


@dataclass
class World:
    x: float
    y: float
    width: float
    height: float
    scale: float = 1.0
    object: object | None = None

    def render(self):
        resizeCanvas(1.0)

    def update(self):
        if self.object is None:
            return
        from .utils import toroidalDelta, wrap

        self.x = wrap(self.x + toroidalDelta(self.x, self.object.x, self.width) * 0.15, self.width)
        self.y = wrap(self.y + toroidalDelta(self.y, self.object.y, self.height) * 0.15, self.height)
        self.angle = getattr(self.object, "angle", 0)

    def zoom(self, f: float = 1.0):
        self.scale *= f

    def attach(self, obj):
        if obj is not None:
            self.object = obj


world = World(x=0, y=0, width=worldSize.width, height=worldSize.height, scale=0.1)