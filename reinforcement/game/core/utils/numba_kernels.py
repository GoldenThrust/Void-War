from __future__ import annotations

import numpy as np
from numba import njit


@njit(fastmath=True)
def build_entity_rows(
    entity_x,
    entity_y,
    entity_angle,
    entity_speed,
    entity_types,
    ship_x,
    ship_y,
    ship_vx,
    ship_vy,
    ship_angle,
    world_width,
    world_height,
    max_speed,
    longest_distance,
):
    """Build normalized observation rows for a batch of nearby entities."""
    rows = np.zeros((entity_x.size, 7), dtype=np.float32)
    speed_scale = max(max_speed * 2.0, 1.0)
    distance_scale = max(longest_distance, 1.0)
    half_width = world_width * 0.5
    half_height = world_height * 0.5
    heading_x = -np.sin(ship_angle)
    heading_y = -np.cos(ship_angle)

    for i in range(entity_x.size):
        dx = (ship_x - entity_x[i]) % world_width
        if dx > half_width:
            dx -= world_width
        if dx < -half_width:
            dx += world_width

        dy = (ship_y - entity_y[i]) % world_height
        if dy > half_height:
            dy -= world_height
        if dy < -half_height:
            dy += world_height

        entity_vx = -np.sin(entity_angle[i]) * entity_speed[i]
        entity_vy = -np.cos(entity_angle[i]) * entity_speed[i]
        relative_vx = (entity_vx - ship_vx) / speed_scale
        relative_vy = (entity_vy - ship_vy) / speed_scale

        distance = np.sqrt(dx * dx + dy * dy)
        if distance > 1e-6:
            direction_x = dx / distance
            direction_y = dy / distance
        else:
            direction_x = 0.0
            direction_y = 0.0

        alignment = heading_x * direction_x + heading_y * direction_y
        alignment = min(max(alignment, -1.0), 1.0)

        rows[i, 0] = min(max(dx / half_width, -1.0), 1.0)
        rows[i, 1] = min(max(dy / half_height, -1.0), 1.0)
        rows[i, 2] = min(max(relative_vx, -1.0), 1.0)
        rows[i, 3] = min(max(relative_vy, -1.0), 1.0)
        rows[i, 4] = min(max(distance / distance_scale, 0.0), 1.0)
        rows[i, 5] = alignment
        rows[i, 6] = entity_types[i]

    return rows
