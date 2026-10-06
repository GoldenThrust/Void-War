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
            from core.ships import player

            return player.ship

        from core.ships.manager import ShipManager

        if 0 <= self.attachedId < len(ShipManager.ships):
            return ShipManager.ships[self.attachedId]
        return None

    def attachRandom(self):
        from core.ships.manager import ShipManager

        if not ShipManager.ships:
            return
        import random

        self.attachedId = random.randrange(len(ShipManager.ships))
        world.attach(ShipManager.ships[self.attachedId])

    def attachNext(self):
        from core.ships.manager import ShipManager

        if not ShipManager.ships:
            return
        self.attachedId = (self.attachedId + 1) % len(ShipManager.ships)
        world.attach(ShipManager.ships[self.attachedId])

    def attachPrevious(self):
        from core.ships.manager import ShipManager

        if not ShipManager.ships:
            return
        self.attachedId = (self.attachedId - 1 + len(ShipManager.ships)) % len(ShipManager.ships)
        world.attach(ShipManager.ships[self.attachedId])

    def attachMainShip(self):
        self.attachedId = -1
        from core.ships.player import ship

        world.attach(ship)


worldManager = WorldManager()
