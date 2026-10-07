from __future__ import annotations

from sympy import Shi

from core.ships.bomber import Bomber
from core.ships.fleet import FleetDrone
from core.ships.miner import Miner
from core.ships.missileLaucher import MissileLaucher
from core.ships.sniper import Sniper
from core.ships.tormenter import Tormenter
from core.ships.ship import Ship, destroyedShips
from core.utils.constants import sizeOf
from core.world.world import world
import numpy as np

from core.utils.misc import is_visible
from core.world.utils import worldToScreen


class ShipManager:
    ships: dict[str, Ship] = {}
    
    types: list = [FleetDrone, Bomber, Miner, MissileLaucher, Sniper, Tormenter]
    enemiesAlive = 0
    friendsAlive = 0

    @staticmethod
    def init():
        ShipManager.ships.clear()
        destroyedShips.clear()
        ShipManager.enemiesAlive = getattr(sizeOf, "enemy_ship", 0)
        ShipManager.friendsAlive = getattr(sizeOf, "friend_ship", 0)

        for _ in range(ShipManager.enemiesAlive):
            cls = ShipManager.types[int(np.random.uniform(0, len(ShipManager.types)))]
            enemy = cls(**{
                "x": np.random.uniform(0, world.width),
                "y": np.random.uniform(0, world.height),
                "angle": np.random.uniform(-np.pi * 2, np.pi * 2),
                "friend": False,
            })
            ShipManager.ships[enemy.id] = enemy
        
        for _ in range(ShipManager.friendsAlive):
            cls = ShipManager.types[int(np.random.uniform(0, len(ShipManager.types)))]
            enemy = cls(**{
                "x": np.random.uniform(0, world.width),
                "y": np.random.uniform(0, world.height),
                "angle": np.random.uniform(-np.pi * 2, np.pi * 2),
                "friend": True,
            })
            ShipManager.ships[enemy.id] = enemy

    @staticmethod
    def destroy(enemy):
        ShipManager.ships.pop(enemy.id, None)
        destroyedShips.append(enemy)
        enemy.state = "dead"
        if enemy.friend:
            ShipManager.friendsAlive -= 1
        else:
            ShipManager.enemiesAlive -= 1

    @staticmethod
    def render():
        for ship in ShipManager.ships.values():
            screen = worldToScreen(ship.x, ship.y)

            if not is_visible(screen["x"], screen["y"], ship.height):
                continue
            ship.render()

    @staticmethod
    def update(t, dt):
        for ship in ShipManager.ships.values():
            ship.update(t, dt)
