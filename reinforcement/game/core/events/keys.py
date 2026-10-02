from __future__ import annotations

from .keybind import keybinds


keys: dict[str, bool] = {}
orientation: dict[str, float] = {}
touchDetected: dict[str, bool] = {}


def trigger_key(key: str):
    keys[key] = True
    callback = keybinds.get(key)
    if callback:
        callback()


def release_key(key: str):
    keys[key] = False
