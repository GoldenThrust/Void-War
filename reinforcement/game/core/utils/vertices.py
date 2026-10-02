from __future__ import annotations

import math

import numpy as np

from core.world.canvas import draw_polygon
from core.world.utils import worldToScreen


def _as_points(vertices):
    points = []
    for vertex in vertices:
        if isinstance(vertex, dict):
            points.append((vertex["x"], vertex["y"]))
        else:
            points.append((vertex.x, vertex.y))
    return np.asarray(points, dtype=float)


def drawVertices(vertices, color="blue"):
    draw_polygon(vertices, color=color, width=0, alpha=128)


def tranformVertices(vertices, cx, cy, scaleX, scaleY, rotation):
    points = _as_points(vertices)
    if not len(points):
        return []
    cos = math.cos(rotation)
    sin = math.sin(rotation)
    hw = scaleX / 2
    hh = scaleY / 2
    scaled = points * np.array([hw, hh], dtype=float)
    rot = np.array([[cos, -sin], [sin, cos]], dtype=float)
    transformed = scaled @ rot.T
    transformed[:, 0] += cx
    transformed[:, 1] += cy
    return [{"x": float(x), "y": float(y)} for x, y in transformed]


def createVerticesPath(vertices):
    return [{"x": v["x"], "y": v["y"]} if isinstance(v, dict) else {"x": v.x, "y": v.y} for v in vertices]


def drawVerticesPath(path, color="blue", fill=True):
    draw_polygon(path, color=color, width=0 if fill else 2, alpha=255)


def getVertices(vertices, x, y, width, height, angle):
    screen = worldToScreen(x, y)
    return tranformVertices(vertices, screen["x"], screen["y"], width, height, angle)
