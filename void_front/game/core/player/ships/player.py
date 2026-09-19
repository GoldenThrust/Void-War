from __future__ import annotations

from game.core.assets.audio.context import audioCtx
from game.core.assets.main import assets
from game.core.utils.math import clamp
from game.core.player.ships.ship import Ship
import numpy as np

ship = None


class PlayerShip(Ship):
    def __init__(self, *, x, y, width, height, angle, acceleration=1000, color="red", name="Player", controllable=True, turnRate=2, maxWeaponHeat=10000):
        super().__init__(x=x, y=y, width=width, height=height, angle=angle, img=getattr(getattr(assets, "images", None), "mainship", None), flameImg=getattr(getattr(assets, "images", None), "flame1", None), acceleration=acceleration, color=color, name=name, maxWeaponHeat=maxWeaponHeat, controllable=controllable, life=10000, turnRate=turnRate)
        self.audioGain = audioCtx.createGain()
        if self.controllable is False:
            self.state = "idle"

    def update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust=thrust, turn=turn)
        if self.speed > 50:
            gain = self.audioGain.gain
            self.audioGain.gain.value = clamp(self.speed / 200, gain.minValue, gain.maxValue)

    @staticmethod
    def spawn(x, y):
        global ship
        angle = np.random.uniform(-np.pi * 2, np.pi * 2)
        spawnDistance = 200000
        spawnX = np.random.uniform(x - spawnDistance, x + spawnDistance)
        spawnY = np.random.uniform(y - spawnDistance, y + spawnDistance)
        ship = PlayerShip(x=spawnX, y=spawnY, angle=angle, width=50, height=50, color="#84d0ff", controllable=False, acceleration=np.random.uniform(50, 100), turnRate=np.random.uniform(2, 4.5))
        
        return ship

