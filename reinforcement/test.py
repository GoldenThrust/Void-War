import numpy

from utils import wrap


def toroidalDelta(a, b, size):
    d = (b - a) % size

    if d > size * 0.5:
        d -= size

    if d < -size * 0.5:
        d += size

    return d


# for i in range(-100, 100, 10):
#     print(f"New Step of {i}")
#     print(abs(toroidalDelta(100, i, 100), 100))


dx = toroidalDelta(2500, 0, 5000)

dy = toroidalDelta(2500, 0, 5000)

print(dx, dy)
relative = numpy.array(
    [dx, dy],
    dtype=numpy.float32,
)
distance = numpy.linalg.norm(relative)
print(distance)
