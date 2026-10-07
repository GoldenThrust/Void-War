from __future__ import annotations

import math
from dataclasses import dataclass

import pygame

from core.world.world import world


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

# Canvas transform state
_transform = {
    "x": 0.0,
    "y": 0.0
}

_transform_stack = []


def _ensure_screen():
    global _screen
    if _screen is None or _screen.get_width() != canvas.width or _screen.get_height() != canvas.height:
        _screen = pygame.display.set_mode(
            (canvas.width, canvas.height),
            flags=pygame.RESIZABLE
        )
        
        print(f"Canvas resized to: {canvas.width}x{canvas.height}")
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


# =========================
# Transform functions
# =========================

def translate(x, y):
    """
    Equivalent to:
        ctx.translate(x, y)
    """
    _transform["x"] += x
    _transform["y"] += y


def reset_transform():
    _transform["x"] = 0
    _transform["y"] = 0


def save():
    """
    Equivalent:
        ctx.save()
    """
    _transform_stack.append(
        (
            _transform["x"],
            _transform["y"]
        )
    )


def restore():
    """
    Equivalent:
        ctx.restore()
    """
    if _transform_stack:
        x, y = _transform_stack.pop()
        _transform["x"] = x
        _transform["y"] = y


def _apply_transform(point):
    x, y = _point_xy(point)

    return (
        x + _transform["x"],
        y + _transform["y"]
    )


def _apply_points(points):
    return [
        _apply_transform(point)
        for point in points
    ]


# =========================
# Helpers
# =========================

def _resolve_color(color):
    if isinstance(color, pygame.Color):
        return color
    return pygame.Color(color)

def _with_alpha(color, alpha):
    resolved = _resolve_color(color)

    if alpha == 255:
        return resolved

    resolved = pygame.Color(resolved)
    resolved.a = max(0, min(255, int(alpha)))

    return resolved


def _point_xy(point):
    if isinstance(point, dict):
        return float(point["x"]), float(point["y"])

    return float(point[0]), float(point[1])


# =========================
# Drawing functions
# =========================

def draw_line(start, end, color="white", width=1, alpha=255):
    screen = _ensure_screen()

    pygame.draw.line(
        screen,
        _with_alpha(color, alpha),
        _apply_transform(start),
        _apply_transform(end),
        max(1, int(width))
    )


def draw_circle(center, radius, color="white", width=0, alpha=255):
    screen = _ensure_screen()

    pygame.draw.circle(
        screen,
        _with_alpha(color, alpha),
        _apply_transform(center),
        max(1, int(radius)),
        width
    )


def draw_polygon(points, color="white", width=0, alpha=255):
    if not points:
        return

    screen = _ensure_screen()

    pygame.draw.polygon(
        screen,
        _with_alpha(color, alpha),
        _apply_points(points),
        width
    )


def draw_text(text, pos, color="white", size=20,
              font_name="monospace",
              anchor="topleft"):

    key = (font_name, size)

    font = _font_cache.get(key)

    if font is None:
        font = pygame.font.SysFont(font_name, size)
        _font_cache[key] = font

    surface = font.render(
        str(text),
        True,
        _resolve_color(color)
    )

    rect = surface.get_rect()

    rect_position = _apply_transform(pos)

    setattr(rect, anchor, rect_position)

    _ensure_screen().blit(surface, rect)



def blit_image(image, center, size=None, angle=0, alpha=255):

    if image is None:
        return

    surface = image

    if not isinstance(surface, pygame.Surface):
        return


    if size is not None:
        surface = pygame.transform.smoothscale(
            surface,
            (
                int(size[0]),
                int(size[1])
            )
        )


    if angle:
        surface = pygame.transform.rotate(
            surface,
            math.degrees(-angle)
        )


    if alpha != 255:
        surface = surface.copy()
        surface.set_alpha(alpha)


    rect = surface.get_rect(
        center=_apply_transform(center)
    )

    _ensure_screen().blit(surface, rect)