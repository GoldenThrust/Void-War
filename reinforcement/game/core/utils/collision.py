from __future__ import annotations

import numpy as np


def boxCircleCollision(box, circle):
    closestX = max(box.x, min(circle.x, box.x + box.w))
    closestY = max(box.y, min(circle.y, box.y + box.h))
    dx = circle.x - closestX
    dy = circle.y - closestY
    return (dx * dx + dy * dy) < (circle.r * circle.r)


def _circle_collision(a, b):
    dx = a.x - b.x
    dy = a.y - b.y
    dist = dx * dx + dy * dy
    sizeSq = a.r * a.r + b.r * b.r
    return dist < sizeSq


def _box_collision(a, b):
    return a.x < b.x + b.w and a.x + a.w > b.x and a.y < b.y + b.h and a.y + a.h > b.y


def checkCollision(a, b):
    if a.shape == "box" and b.shape == "box":
        return _box_collision(a, b)
    if a.shape == "circle" and b.shape == "circle":
        return _circle_collision(a, b)
    if a.shape == "box" and b.shape == "circle":
        return boxCircleCollision(a, b)
    if a.shape == "circle" and b.shape == "box":
        return boxCircleCollision(b, a)
    return False


def _project(vertices, axis):
    projections = np.dot(vertices, axis)
    return float(np.min(projections)), float(np.max(projections))


def _get_axes(vertices):
    axes = []
    for i in range(len(vertices)):
        next_i = (i + 1) % len(vertices)
        edge = vertices[next_i] - vertices[i]
        length = np.hypot(edge[0], edge[1])
        if length == 0:
            continue
        axes.append(np.array([-edge[1] / length, edge[0] / length], dtype=float))
    return axes


def isSeperatingAxes(poly1, poly2):
    vertices1 = np.array([[v["x"], v["y"]] if isinstance(v, dict) else [v.x, v.y] for v in poly1], dtype=float)
    vertices2 = np.array([[v["x"], v["y"]] if isinstance(v, dict) else [v.x, v.y] for v in poly2], dtype=float)
    smallestOverlap = float("inf")
    smallestAxis = None
    axes = _get_axes(vertices1) + _get_axes(vertices2)

    for axis in axes:
        min1, max1 = _project(vertices1, axis)
        min2, max2 = _project(vertices2, axis)
        if max1 < min2 or max2 < min1:
            return {"collision": False}
        overlap = min(max1, max2) - max(min1, min2)
        if overlap < smallestOverlap:
            smallestOverlap = overlap
            smallestAxis = {"x": float(axis[0]), "y": float(axis[1])}

    return {"collision": True, "smallestOverlap": smallestOverlap, "smallestAxis": smallestAxis}
