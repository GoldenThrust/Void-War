from __future__ import annotations


explosions = []


class Explosion:
    def __init__(self, x, y, duration=0.35):
        self.x = x
        self.y = y
        self.duration = duration
        self.elapsed = 0.0

    def update(self, dt):
        self.elapsed += dt
        if self.elapsed >= self.duration and self in explosions:
            explosions.remove(self)

    def render(self):
        return None


def spawn(x, y):
    explosion = Explosion(x, y)
    explosions.append(explosion)
    return explosion