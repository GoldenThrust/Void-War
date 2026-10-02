from __future__ import annotations

import math
from dataclasses import dataclass

import pygame


# class NoOpContext:
#     def __init__(self):
#         self.fillStyle = None
#         self.strokeStyle = None
#         self.globalAlpha = 1
#         self.lineWidth = 1
#         self.font = ""

#     def __getattr__(self, _name):
#         def _noop(*_args, **_kwargs):
#             return None

#         return _noop


# pygame.init()
# pygame.font.init()


@dataclass
class Canvas:
    width: int = 1920
    height: int = 1080


canvas = Canvas()
canvasWidth = canvas.width
canvasHeight = canvas.height

_screen = None
_clock = pygame.time.Clock()
_font_cache: dict[tuple[str, int], pygame.font.Font] = {}


def _ensure_screen():
    global _screen
    if _screen is None or _screen.get_width() != canvas.width or _screen.get_height() != canvas.height:
        _screen = pygame.display.set_mode((canvas.width, canvas.height), flags=pygame.RESIZABLE)
    return _screen


def get_screen():
    return _ensure_screen()


def get_clock():
    return _clock


def resizeCanvas(scale: float = 1.0):
    canvas.width = int(canvasWidth * scale)
    canvas.height = int(canvasHeight * scale)
    return _ensure_screen()


def clear(color=(0, 0, 0)):
    _ensure_screen().fill(color)


def present():
    pygame.display.flip()


def _resolve_color(color):
    if isinstance(color, pygame.Color):
        return color
    return pygame.Color(color)


def _with_alpha(color, alpha):
    resolved = _resolve_color(color)
    if alpha == 255:
        return resolved
    resolved.a = max(0, min(255, int(alpha)))
    return resolved


def _point_xy(point):
    if isinstance(point, dict):
        return float(point["x"]), float(point["y"])
    return float(point[0]), float(point[1])


def draw_line(start, end, color="white", width=1, alpha=255):
    screen = _ensure_screen()
    pygame.draw.line(screen, _with_alpha(color, alpha), _point_xy(start), _point_xy(end), max(1, int(width)))


def draw_circle(center, radius, color="white", width=0, alpha=255):
    screen = _ensure_screen()
    pygame.draw.circle(screen, _with_alpha(color, alpha), _point_xy(center), max(1, int(radius)), width)


def draw_polygon(points, color="white", width=0, alpha=255):
    if not points:
        return
    screen = _ensure_screen()
    resolved = [_point_xy(point) for point in points]
    pygame.draw.polygon(screen, _with_alpha(color, alpha), resolved, width)


def draw_text(text, pos, color="white", size=20, font_name="monospace", anchor="topleft"):
    key = (font_name, size)
    font = _font_cache.get(key)
    if font is None:
        font = pygame.font.SysFont(font_name, size)
        _font_cache[key] = font
    surface = font.render(str(text), True, _resolve_color(color))
    rect = surface.get_rect()
    setattr(rect, anchor, pos)
    _ensure_screen().blit(surface, rect)


def blit_image(image, center, size=None, angle=0, alpha=255):
    if image is None:
        return
    surface = image
    if not isinstance(surface, pygame.Surface):
        return
    if size is not None:
        surface = pygame.transform.smoothscale(surface, (int(size[0]), int(size[1])))
    if angle:
        surface = pygame.transform.rotate(surface, math.degrees(-angle))
    if alpha != 255:
        surface = surface.copy()
        surface.set_alpha(alpha)
    rect = surface.get_rect(center=_point_xy(center))
    _ensure_screen().blit(surface, rect)
