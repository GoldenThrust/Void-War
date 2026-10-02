from __future__ import annotations

from core.player.prop.explosion import Explosion, explosions
from core.player.ships.enemies.bomber import Bomber
from core.player.ships.enemies.fleet import FleetDrone
from core.player.ships.enemies.miner import Miner
from core.player.ships.enemies.missileLaucher import MissileLaucher
from core.player.ships.enemies.sniper import Sniper
from core.player.ships.enemies.tormenter import Tormenter
from core.player.ships.ship import destroyedShips
from core.utils.constants import sizeOf
from core.world.world import world
import numpy as np


class EnemyManager:
    ships: list = []
    types: list = []

    @staticmethod
    def init(num_enemies: int = sizeOf.ship):
        EnemyManager.types = [
            FleetDrone,
            Bomber,
            Miner,
            MissileLaucher,
            Sniper,
            Tormenter,
        ]
        EnemyManager.ships.clear()
        destroyedShips.clear()
        for _ in range(num_enemies):
            cls = EnemyManager.types[int(np.random.uniform(0, len(EnemyManager.types)))]
            enemy = cls(
                x=np.random.uniform(0, world.width),
                y=np.random.uniform(0, world.height),
                angle=np.random.uniform(-np.pi * 2, np.pi * 2),
            )
            enemy.friend = False
            EnemyManager.ships.append(enemy)

    @staticmethod
    def destroy(enemy):
        index = EnemyManager.ships.index(enemy) if enemy in EnemyManager.ships else -1
        if index > -1:
            enemy.state = "dead"
            explosions.append(Explosion(enemy.x, enemy.y))
            destroyedShips.append(EnemyManager.ships.pop(index))

    @staticmethod
    def render():
        for ship in EnemyManager.ships:
            ship.render()

    @staticmethod
    def update(t, dt):
        for ship in EnemyManager.ships:
            ship.update(t, dt)
