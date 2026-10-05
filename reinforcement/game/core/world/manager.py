from __future__ import annotations

from core.world.world import world
from core.events.keybind import keybinds


class WorldManager:
    def __init__(self):
        self.attachedId = -1
        self._add_keybinds()

    def _add_keybinds(self):
        keybinds["5"] = self.attachNext
        keybinds["6"] = self.attachPrevious
        keybinds["7"] = self.attachMainShip
        keybinds["8"] = self.attachRandom
        keybinds["="] = lambda: world.zoom(1.1)
        keybinds["-"] = lambda: world.zoom(0.9)

    def findAttachedShip(self):
        if self.attachedId == -1:
            from reinforcement.game.core.ships import player

            return player.ship

        from reinforcement.game.core.ships.manager import EnemyManager

        if 0 <= self.attachedId < len(EnemyManager.ships):
            return EnemyManager.ships[self.attachedId]
        return None

    def attachRandom(self):
        from reinforcement.game.core.ships.manager import EnemyManager

        if not EnemyManager.ships:
            return
        import random

        self.attachedId = random.randrange(len(EnemyManager.ships))
        world.attach(EnemyManager.ships[self.attachedId])

    def attachNext(self):
        from reinforcement.game.core.ships.manager import EnemyManager

        if not EnemyManager.ships:
            return
        self.attachedId = (self.attachedId + 1) % len(EnemyManager.ships)
        world.attach(EnemyManager.ships[self.attachedId])

    def attachPrevious(self):
        from reinforcement.game.core.ships.manager import EnemyManager

        if not EnemyManager.ships:
            return
        self.attachedId = (self.attachedId - 1 + len(EnemyManager.ships)) % len(EnemyManager.ships)
        world.attach(EnemyManager.ships[self.attachedId])

    def attachMainShip(self):
        self.attachedId = -1
        from reinforcement.game.core.ships.player import ship

        world.attach(ship)


worldManager = WorldManager()
