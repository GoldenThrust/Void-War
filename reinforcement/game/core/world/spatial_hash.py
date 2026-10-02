from __future__ import annotations

from dataclasses import dataclass, field

from core.world.utils import wrap
from core.world.world import world


@dataclass
class SpatialHash:
    worldWidth: float
    worldHeight: float
    cellSize: int
    map: dict[str, list] = field(default_factory=dict)

    def __post_init__(self):
        self.cols = int((self.worldWidth + self.cellSize - 1) // self.cellSize)
        self.rows = int((self.worldHeight + self.cellSize - 1) // self.cellSize)

    def clear(self):
        self.map.clear()

    def hash(self, cx, cy):
        return cy * self.cols + cx

    def wrapCellX(self, cx):
        return int(wrap(cx, self.cols))

    def wrapCellY(self, cy):
        return int(wrap(cy, self.rows))

    def insert(self, obj):
        cx = self.wrapCellX(int(obj.x // self.cellSize))
        cy = self.wrapCellY(int(obj.y // self.cellSize))
        key = self.hash(cx, cy)
        self.map.setdefault(key, []).append(obj)

    def insertAll(self, *object_groups):
        for elements in object_groups:
            for element in elements:
                if element != "Minature":
                    self.insert(element)

    def query(self, x, y, radius=None):
        if radius is None:
            radius = self.cellSize * 2
        results = []
        minX = int((x - radius) // self.cellSize)
        maxX = int((x + radius) // self.cellSize)
        minY = int((y - radius) // self.cellSize)
        maxY = int((y + radius) // self.cellSize)

        for cy in range(minY, maxY + 1):
            for cx in range(minX, maxX + 1):
                wrappedX = self.wrapCellX(cx)
                wrappedY = self.wrapCellY(cy)
                bucket = self.map.get(self.hash(wrappedX, wrappedY))
                if not bucket:
                    continue
                results.extend(bucket)

        return results

spatial = SpatialHash(world.width, world.height, 300)
