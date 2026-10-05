import time

import pygame

from core.events.keys import release_key, trigger_key
from reinforcement.game.core.ships.manager import EnemyManager
from reinforcement.game.core.ships import player
from core.perks.manager import PerkManager
from core.utils.constants import FIXED_DT
from core.world.canvas import clear, draw_text, get_screen, present
from core.world.spatial_hash import spatial
from core.world.world import world
from core.weapons.manager import WeaponManager

_last_time = None
_time_accumulator = 0.0
_clock = pygame.time.Clock()
_pygame_key_names = {
    pygame.K_UP: "ArrowUp",
    pygame.K_DOWN: "ArrowDown",
    pygame.K_LEFT: "ArrowLeft",
    pygame.K_RIGHT: "ArrowRight",
    pygame.K_RETURN: "Enter",
    pygame.K_SPACE: "Space",
}


def init() -> None:
    player.PlayerShip.spawn(world.x, world.y, controllable=True)
    EnemyManager.init()
    WeaponManager.init()
    PerkManager.spawn()
    world.attach(player.ship)


def update_loop(now: float) -> bool:
    global _last_time, _time_accumulator

    if _last_time is None:
        _last_time = now

    delta = min(max(now - _last_time, 0.0), 1.0)
    _last_time = now
    _time_accumulator += delta

    while _time_accumulator >= FIXED_DT:
        spatial.clear()
        spatial.insertAll([player.ship], EnemyManager.ships, WeaponManager.weapons, PerkManager.perks.values())

        world.update()

        WeaponManager.update(now, FIXED_DT)

        EnemyManager.update(now, FIXED_DT)

        if player.ship is not None:
            player.ship.update(now, FIXED_DT)

        PerkManager.update(now)

        _time_accumulator -= FIXED_DT

    clear((0, 0, 0))
    world.render()

    WeaponManager.render()
    PerkManager.render()

    if player.ship is not None:
        player.ship.render()

    EnemyManager.render()

    draw_text(
        (
            f"Ships Alive: {len(EnemyManager.ships)} - Destroyed: 0 - "
            f"Kill: {getattr(player.ship, 'killScore', 0)} Weapon name: "
            f"{getattr(getattr(player.ship, 'weapon', None), 'name', '')} heat: "
            f"{int((getattr(player.ship, 'heat', 0) / max(getattr(player.ship, 'maxHeat', 1), 1)) * 100)}"
        ),
        (10, 20),
        color="white",
        size=20,
    )
    present()
    
    return player.ship is not None and player.ship.life > 0 and len(EnemyManager.ships) > 0


def game_loop() -> None:
    init()
    running = True

    while running:
        now = time.perf_counter()
        print(f"FPS: {int(_clock.get_fps())}")
        playing = update_loop(now)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False
            elif event.type == pygame.KEYDOWN:
                trigger_key(_pygame_key_names.get(event.key, pygame.key.name(event.key)))
            elif event.type == pygame.KEYUP:
                release_key(_pygame_key_names.get(event.key, pygame.key.name(event.key)))

        if not playing:
            screen = get_screen()
            text = "Game Over 😭. Try again." if player.ship is None or player.ship.life <= 0 else "You dominate the void 🥳."
            draw_text(text, (screen.get_width() / 2, screen.get_height() / 2), color="white", size=50, anchor="center")
            present()
            pygame.time.wait(1000)
            running = False

        _clock.tick(60)


if __name__ == "__main__":
    pygame.init()
    game_loop()
    pygame.quit()
