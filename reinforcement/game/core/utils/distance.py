from __future__ import annotations

from core.world.spatial_hash import spatial


def boxCircleDistance(box, circle):
    cx = max(box.x, min(circle.x, box.x + box.w))
    cy = max(box.y, min(circle.y, box.y + box.h))
    dx = circle.x - cx
    dy = circle.y - cy
    return dx * dx + dy * dy


def distance(a, b):
    if a.shape == "box" and b.shape == "box":
        dx = max(a.x - (b.x + b.w), b.x - (a.x + a.w), 0)
        dy = max(a.y - (b.y + b.h), b.y - (a.y + a.h), 0)
        return dx * dx + dy * dy
    if a.shape == "circle" and b.shape == "circle":
        dx = a.x - b.x
        dy = a.y - b.y
        return dx * dx + dy * dy
    if a.shape == "box" and b.shape == "circle":
        return boxCircleDistance(a, b)
    if a.shape == "circle" and b.shape == "box":
        return boxCircleDistance(b, a)
    return 0


def withinRange(a, b, dist):
    return distance(a, b) < dist * dist


def nearByEnemy(self, callback=lambda *_: None):
    from ..ships.ship import Ship

    object_list = spatial.query(self.x, self.y)
    for ship in object_list:
        if isinstance(ship, Ship) and ship is not self:
            callback(ship)
