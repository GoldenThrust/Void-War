from __future__ import annotations

from uuid import uuid4

from core.ships.ship import Ship
from core.utils.collision import isSeperatingAxes
from core.utils.vertices import createVerticesPath, tranformVertices
from core.world.canvas import draw_polygon
from core.world.spatial_hash import spatial
from core.world.utils import worldToScreen
from core.world.world import world

from .shapes import shapes


class Perk:
    def __init__(self, *, x, y, angle, name="Perk", width=40, height=40,
                 vertices=None, duration=1.0, color="#d2ff52"):
        self.id = str(uuid4())
        self.name = name
        self.x = x
        self.y = y
        self.angle = angle
        self.width = width
        self.height = height
        self.vertices = vertices or shapes[0]
        self.color = color
        self.duration = duration
        self.ship = None
        self.start_time = None
        self.path2D = createVerticesPath(
            tranformVertices(self.vertices, 0, 0, self.width, self.height, 0)
        )

    def getVertices(self):
        screen = worldToScreen(self.x, self.y)
        return tranformVertices(
            self.vertices, screen["x"], screen["y"], self.width, self.height, self.angle
        )

    def render(self):
        if self.ship is None:
            draw_polygon(self.getVertices(), color=self.color, width=0, alpha=255)

    def update(self, now):
        self.nearBy()
        if self.ship is None:
            return
        if self.start_time is None:
            self.start_time = now
        if now - self.start_time > self.duration:
            self.finishedRunning()

    def nearBy(self, radius=None):
        if self.ship is not None:
            return
        for element in spatial.query(self.x, self.y, radius):
            if isinstance(element, Ship) and isSeperatingAxes(
                element.getVertices(), self.getVertices()
            ).get("collision"):
                self.colide(element)
                break

    def getShip(self):
        return self.ship

    def colide(self, ship):
        self.ship = ship

    def finishedRunning(self):
        from .manager import PerkManager

        PerkManager.perks.pop(self.id, None)