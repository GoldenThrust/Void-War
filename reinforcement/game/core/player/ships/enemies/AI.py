from __future__ import annotations

from core.assets.main import assets
from core.player.ships.enemies.enemy import EnemyShip
from core.player.ships.shapes import shapes
from core.weapons.plasma_canon import PlasmaCanon


class AI(EnemyShip):
    def __init__(self, x=10, y=20, angle=0):
        super().__init__(x=x, y=y, width=50, height=50, angle=angle, acceleration=1000, color="blue", vertices=shapes[4], name="Bomber Drone", maxWeaponHeat=10000, life=200, weapon=PlasmaCanon, img=getattr(getattr(assets, "images", None), "bombership", None), flameImg=getattr(getattr(assets, "images", None), "flame2", None))
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 0.9
        self.predicting = False
        self.state = "AI"

    def update(self, t, dt, thrust=0, turn=0):
        super().update(t, dt, thrust, turn)
