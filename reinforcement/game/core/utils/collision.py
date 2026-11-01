from __future__ import annotations

import numpy as np
from numba import njit


@njit(fastmath=True)
def _sat_collision(vertices1, vertices2):
    smallest_overlap = np.inf
    smallest_axis_x = 0.0
    smallest_axis_y = 0.0

    for polygon in range(2):
        vertices = vertices1 if polygon == 0 else vertices2
        other = vertices2 if polygon == 0 else vertices1
        for i in range(vertices.shape[0]):
            next_i = (i + 1) % vertices.shape[0]
            edge_x = vertices[next_i, 0] - vertices[i, 0]
            edge_y = vertices[next_i, 1] - vertices[i, 1]
            length = np.sqrt(edge_x * edge_x + edge_y * edge_y)
            if length == 0:
                continue

            axis_x = -edge_y / length
            axis_y = edge_x / length
            min1 = np.inf
            max1 = -np.inf
            min2 = np.inf
            max2 = -np.inf

            for vertex in range(vertices.shape[0]):
                projection = (
                    vertices[vertex, 0] * axis_x
                    + vertices[vertex, 1] * axis_y
                )
                min1 = min(min1, projection)
                max1 = max(max1, projection)
            for vertex in range(other.shape[0]):
                projection = (
                    other[vertex, 0] * axis_x
                    + other[vertex, 1] * axis_y
                )
                min2 = min(min2, projection)
                max2 = max(max2, projection)

            if max1 < min2 or max2 < min1:
                return False, 0.0, 0.0, 0.0

            overlap = min(max1, max2) - max(min1, min2)
            if overlap < smallest_overlap:
                smallest_overlap = overlap
                smallest_axis_x = axis_x
                smallest_axis_y = axis_y

    return True, smallest_overlap, smallest_axis_x, smallest_axis_y


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


def isSeperatingAxes(poly1, poly2):
    vertices1 = np.array([[v["x"], v["y"]] if isinstance(v, dict) else [v.x, v.y] for v in poly1], dtype=float)
    vertices2 = np.array([[v["x"], v["y"]] if isinstance(v, dict) else [v.x, v.y] for v in poly2], dtype=float)
    collision, overlap, axis_x, axis_y = _sat_collision(vertices1, vertices2)
    return {
        "collision": bool(collision),
        "smallestOverlap": float(overlap),
        "smallestAxis": {"x": float(axis_x), "y": float(axis_y)}
        if collision
        else None,
    }
