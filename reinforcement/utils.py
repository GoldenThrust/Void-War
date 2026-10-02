def wrap(value, size):
    return ((value % size) + size) % size


def toroidalDelta(a, b, size):
    d = (b - a) % size
    if d > size * 0.5:
        d -= size

    if d < -size * 0.5:
        d += size

    return d
