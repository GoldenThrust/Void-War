from __future__ import annotations

from core.player.ships.ship import Ship
from core.utils.collision import isSeperatingAxes
from core.utils.vertices import createVerticesPath, tranformVertices
from core.world.canvas import blit_image, draw_polygon
from core.world.spatial_hash import spatial
from core.world.utils import worldToScreen
import numpy as np


class Weapon:
    def __init__(self, options, force=False):
        from core.weapons.shapes import shapes

        self.name = options.get("name")
        self.type = options.get("type")
        self.acceleration = options.get("acceleration", 10)
        self.speed = options.get("speed", 10)
        self.x = options.get("x")
        self.y = options.get("y")
        self.width = options.get("width")
        self.height = options.get("height")
        self.angle = options.get("angle")
        self.damage = options.get("damage", 10)
        self.img = options.get("img")
        self.range = options.get("range", 1000)
        self.fireRate = options.get("fireRate", 1)
        self.energyCost = options.get("energyCost", 10)
        self.vertices = options.get("vertices", shapes[0])
        self.color = options.get("color", "red")
        self.ship = options.get("ship")
        self.dampSpeed = 0.99
        self.path2D = createVerticesPath(tranformVertices(self.vertices, 0, -self.height / 2, self.width, self.height, 0))
        self.active = True
        if not force and self.ship is not None:
            self.ship.increaseHeat(self.energyCost)
            self.ship.setCoolDown(1 / self.fireRate)

    def render(self):
        if self.img is not None:
            blit_image(self.img, (self.x, self.y), size=(self.width, self.height), angle=self.angle)
        else:
            draw_polygon(self.getVertices(), color=self.color, width=0, alpha=255)

    def destroy(self):
        from core.weapons.manager import WeaponManager

        WeaponManager.destroy(self)

    def getVertices(self):
        screen = worldToScreen(self.x, self.y)
        return tranformVertices(self.vertices, screen["x"], screen["y"], self.width, self.height, self.angle)

    @staticmethod
    def nearBy(weapon, vertices, x, y):
        object_list = spatial.query(x, y)
        for element in object_list:
            if isinstance(element, Ship) and (weapon.ship == element or getattr(element, "state", None) == "dead"):
                continue
            if isinstance(element, Weapon) and (weapon.ship == element.ship or weapon is element):
                continue
            if hasattr(weapon, "closeObject"):
                weapon.closeObject(element)
            if isSeperatingAxes(element.getVertices(), vertices).get("collision"):
                weapon.ship.damage_score = weapon.damage
                if isinstance(element, Ship):
                    element.life = max(0, element.life - weapon.damage)
                    if element.life <= 0:
                        element.destroy()
                        weapon.ship.killScore += 1
                else:
                    element.destroy()
                weapon.acceleration *= 0.8
                weapon.range *= 0.8
                if hasattr(weapon, "penetration"):
                    weapon.penetration -= 1
                    if not weapon.penetration:
                        weapon.colide()
                        weapon.destroy()

    def colliding(self):
        Weapon.nearBy(self, self.getVertices(), self.x, self.y)

    def colide(self):
        pass

    def travelEnd(self):
        pass

    def closeObject(self, obj):
        pass
