from __future__ import annotations


def isPromise(value):
    return value is not None and hasattr(value, "then") and callable(getattr(value, "then"))
