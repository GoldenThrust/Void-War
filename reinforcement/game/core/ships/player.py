from __future__ import annotations

from core.utils.math import clamp
from core.ships.ship import Ship
import numpy as np

ship = None


class PlayerShip(Ship):
    def __init__(self, **options):
        options.update(name="Player", vertices=options.get("vertices", np.array([[0, 0], [1, 0], [0.5, 1]])), x=options.get("x", 10), y=options.get("y", 20), angle=options.get("angle", 0), width= options.get("width", 40), height= options.get("height", 40), acceleration= options.get("acceleration", 600), color=options.get("color", "red"))
        super().__init__(**options)
    
        self.audioGain = None
        if self.controllable is False:
            self.state = "idle"

    @property
    def heatpercent(self):
        return clamp(self.weaponHeat / self.maxWeaponHeat, 0, 1)

    @staticmethod
    def spawn(x, y, controllable=False):
        global ship
        angle = np.random.uniform(-np.pi * 2, np.pi * 2)
        if controllable:
            spawnX = x
            spawnY = y
        else:
            spawnDistance = 200000
            spawnX = np.random.uniform(x - spawnDistance, x + spawnDistance)
            spawnY = np.random.uniform(y - spawnDistance, y + spawnDistance)
        ship = PlayerShip({
            "x": spawnX,
            "y": spawnY,
            "angle": angle,
            "width": 50,
            "height": 50,
            "color": "#84d0ff",
            "controllable": controllable,
        })
        
        return ship

