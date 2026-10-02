from __future__ import annotations

import math

TAU = math.pi * 2


def clamp(value, min_value, max_value=None):
    if max_value is None:
        return max(-min_value, min(min_value, value))
    return max(min_value, min(max_value, value))


def normalizeAngle(angle):
    return ((angle % TAU) + TAU) % TAU


def shortestAngleDist(a, b):
    return ((b - a + math.pi * 3) % TAU) - math.pi


def clampAngle(angle, min_angle, max_angle):
    angle = normalizeAngle(angle)
    min_angle = normalizeAngle(min_angle)
    max_angle = normalizeAngle(max_angle)
    range_ = (max_angle - min_angle + TAU) % TAU
    relative = (angle - min_angle + TAU) % TAU

    if relative <= range_:
        return angle

    to_min = shortestAngleDist(angle, min_angle)
    to_max = shortestAngleDist(angle, max_angle)
    return min_angle if abs(to_min) < abs(to_max) else max_angle
