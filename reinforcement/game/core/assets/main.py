from __future__ import annotations

from types import SimpleNamespace



assets = SimpleNamespace(images=SimpleNamespace(), videos=SimpleNamespace(), audios=SimpleNamespace())


def load_audio(_src):
    return None


def build_assets():
    return assets
