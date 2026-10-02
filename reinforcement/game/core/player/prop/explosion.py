from __future__ import annotations

from dataclasses import dataclass, field

from core.assets.main import assets
import numpy as np
from core.world.canvas import blit_image, draw_circle
from core.world.utils import drawWrapped, wrap
from core.world.world import world


explosions: list["Explosion"] = []


@dataclass
class Explosion:
    x: float
    y: float
    intensity: int = 100
    life: int = 50
    particles: list[dict] = field(default_factory=list)

    def __post_init__(self):
        if not self.particles:
            count = max(int(self.intensity / 10), 1)
            self.particles = [
                {
                    "x": self.x,
                    "y": self.y,
                    "vx": np.random.uniform(-self.intensity, self.intensity) / 10,
                    "vy": np.random.uniform(-self.intensity, self.intensity) / 10,
                    "radius": np.random.uniform(0.1, 2),
                }
                for _ in range(count)
            ]
        self.img = getattr(getattr(assets, "images", None), "explosionflame", None)

    def render(self):
        for particle in self.particles:
            if self.img is not None:
                blit_image(self.img, (particle["x"], particle["y"]), size=(10, 10), angle=0, alpha=255)
            else:
                draw_circle((particle["x"], particle["y"]), particle["radius"], color="red", alpha=255)
            particle["x"] = wrap(particle["x"] + particle["vx"], world.width)
            particle["y"] = wrap(particle["y"] + particle["vy"], world.height)

        self.life -= 1
        if self.life <= 0:
            self.destroy()

    def destroy(self):
        if self in explosions:
            explosions.remove(self)
