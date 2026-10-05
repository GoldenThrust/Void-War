from __future__ import annotations

import random


def randomNum(minimum: float, maximum: float) -> float:
    return random.uniform(minimum, maximum)


def randomPick(items: list):
    return random.choice(items)


def randDiv(minimum: float, maximum: float, divisor: float) -> float:
    min_multiple = int(-(-minimum // divisor))
    max_multiple = int(maximum // divisor)
    return random.randint(min_multiple, max_multiple) * divisor