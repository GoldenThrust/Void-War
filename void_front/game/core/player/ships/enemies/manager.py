from __future__ import annotations

from game.core.player.prop.explosion import Explosion, explosions
from game.core.player.ships.enemies.bomber import Bomber
from game.core.player.ships.enemies.fleet import FleetDrone
from game.core.player.ships.enemies.miner import Miner
from game.core.player.ships.enemies.missileLaucher import MissileLaucher
from game.core.player.ships.enemies.sniper import Sniper
from game.core.player.ships.enemies.tormenter import Tormenter
from game.core.player.ships.ship import destroyedShips
from game.core.utils.constants import sizeOf
from game.core.world.world import world
import numpy as np


class EnemyManager:
    ships: list = []
    types: list = []

    @staticmethod
    def init(num_enemies: int = sizeOf.ship):
        EnemyManager.types = [
            # FleetDrone,
            Bomber,
            # Miner,
            # MissileLaucher,
            # Sniper,
            # Tormenter,
        ]
        EnemyManager.ships.clear()
        for _ in range(num_enemies):
            cls = EnemyManager.types[int(np.random.uniform(0, len(EnemyManager.types)))]
            EnemyManager.ships.append(
                cls(
                    x=np.random.uniform(0, world.width),
                    y=np.random.uniform(0, world.height),
                    angle=np.random.uniform(-np.pi * 2, np.pi * 2),
                )
            )

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
