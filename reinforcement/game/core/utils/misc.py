from __future__ import annotations

from core.world.canvas import canvas
from core.world.world import world
from core.world.utils import toroidalDelta


def isPromise(value):
    return value is not None and hasattr(value, "then") and callable(getattr(value, "then"))

def is_visible(wx, wy, radius=0):
    dx = toroidalDelta(world.x, wx, world.width)
    dy = toroidalDelta(world.y, wy, world.height)

    half_w = canvas.width / 2
    half_h = canvas.height / 2

    return (
        -half_w - radius <= dx <= half_w + radius and
        -half_h - radius <= dy <= half_h + radius
    )