from __future__ import annotations

import math
from typing import Callable

from core.world.canvas import canvas
from core.world.world import world


def wrap(value, size):
    return ((value % size) + size) % size

def lerp(a, b, t):
    return a + (b - a) * t

def toroidalDelta(a, b, size):
    d = (b - a) % size
    if d > size * 0.5:
        d -= size
    if d < -size * 0.5:
        d += size
    return d


def toroidalDistance(x1, y1, x2, y2, space=world):
    dx = toroidalDelta(x1, x2, space.width)
    dy = toroidalDelta(y1, y2, space.height)
    return dx * dx + dy * dy


def toroidalAngle(x1, y1, x2, y2, space=world):
    dx = toroidalDelta(x1, x2, space.width)
    dy = toroidalDelta(y1, y2, space.height)
    return math.atan2(dy, dx)


def toroidalDirection(x1, y1, x2, y2, angle, offset=0):
    target_angle = toroidalAngle(x1, y1, x2, y2, world)
    diff = (target_angle + angle) + offset
    return math.atan2(math.sin(diff), math.cos(diff))


def worldToScreen(wx, wy, space=world):
    dx = toroidalDelta(space.x, wx, space.width)
    dy = toroidalDelta(space.y, wy, space.height)
    return {"x": dx + space.width / 2, "y": dy + space.height / 2}


def inScreen(*, x, y, space=world, screen=canvas, margin=None):
    margin = margin or {"width": 100, "height": 100}
    mx = margin["width"] + ((screen.width / world.scale) - space.width) / 2
    my = margin["height"] + ((screen.height / world.scale) - space.height) / 2
    return x > -mx and x < space.width + mx and y > -my and y < space.height + my


def updateWrapped(*, fn: Callable, x, y, margin=None, space=world, screen=canvas):
    margin = margin or {"width": 0, "height": 0}
    base = worldToScreen(x, y, space)
    sx = base["x"]
    sy = base["y"]
    if inScreen(x=sx, y=sy, space=space, screen=screen, margin=margin):
        fn(sx, sy)


def drawWrapped(*, fn: Callable, x, y, margin=None, space=world, screen=canvas):
    updateWrapped(fn=fn, x=x, y=y, margin=margin, space=space, screen=screen)
