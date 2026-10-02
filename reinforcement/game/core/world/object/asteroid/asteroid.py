from __future__ import annotations


class Asteroid:
    shape = "circle"

    def __init__(self, x=0, y=0, r=1):
        self.x = x
        self.y = y
        self.r = r
        self.w = r * 2
        self.h = r * 2

    def getVertices(self):
        return []
