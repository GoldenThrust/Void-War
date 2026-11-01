import os
import sys

import numpy as np
import gymnasium as gym
from gymnasium import spaces
import pygame


GAME_DIR = os.path.join(os.path.dirname(__file__), "game")
if GAME_DIR not in sys.path:
    sys.path.insert(0, GAME_DIR)

from game.core.ships.manager import ShipManager
from game.core.weapons.manager import WeaponManager
from game.core.world.canvas import clear, draw_text, get_screen
from game.core.world.utils import toroidalDelta, toroidalDistance, wrap
from game.core.world.spatial_hash import spatial
from game.core.world.world import world
from game.core.utils.numba_kernels import build_entity_rows


from game.core.ships import player
from game.core.world.world import world as game_world


class VoidFrontEnv(gym.Env):
    """
    Void Front navigation environment.

    The agent controls one ship inside a toroidal world.

    Action:
        thrust
        turn

    Observation:
        self
        enemies
        weapons
    """

    metadata = {
        "render_modes": ["human", "rgb_array"],
        "render_fps": 60,
    }

    def __init__(
        self,
        world_width=1_00_000,
        world_height=1_00_000,
        dt=1 / 60,
        max_speed=50000.0,
        speed_damping=0.999,
        max_enemies=100,
        max_weapons=100,
        view_radius=15000.0,
        max_episode_steps=10000,
        render_mode=None,
    ):
        super().__init__()

        self.world_width = float(getattr(game_world, "width", world_width))
        self.world_height = float(getattr(game_world, "height", world_height))

        # =========================================================
        # ENVIRONMENT
        # =========================================================

        self.dt = float(dt)

        self.speed_damping = float(speed_damping)

        self.max_speed = float(max_speed)

        # Enemies and weapons are stored in a spatial hash and can be
        # of any number/size at runtime. K_enemies / K_weapons are just
        # the fixed-size slot budgets we expose to the observation
        # space; the actual population living in ShipManager /
        # WeaponManager can be smaller or larger than this at any time.
        self.K_enemies = int(max_enemies)
        self.K_weapons = int(max_weapons)

        # Radius (world units) used when querying the ship's spatial
        # hash for nearby players/weapons via getNearPlayers/getNearWeapons.
        self.view_radius = float(view_radius)

        # Weapons/projectiles are only treated as an active threat inside
        # this (smaller, tighter) radius. Keeping it separate from
        # view_radius means the agent can *see* a weapon well before it
        # needs to react to it.
        self.threat_radius = float(view_radius) * 0.35

        self.max_episode_steps = int(max_episode_steps)

        # =========================================================
        # REWARD WEIGHTS (tune here, not inline in _calculate_reward)
        # =========================================================
        self.w_progress = 4.0  # closing distance on nearest enemy
        self.w_alignment = 1.5  # facing the nearest enemy
        self.w_damage_dealt = 0.05  # per point of damage_score delta
        self.w_kill = 20.0  # per kill
        self.w_win = 100.0  # clearing the whole enemy population
        self.w_damage_taken = 0.001  # per point of health lost
        self.w_death = 10.0  # dying this step
        self.w_threat_shaping = (
            3.0  # reward for increasing distance from nearest threatening weapon
        )
        self.w_threat_proximity = (
            1.5  # extra penalty for being deep inside threat_radius
        )
        self.living_reward = 0
        self.time_penalty = 0.001
        self.timeout_penalty = 5.0

        # Distance (not health/score) trackers used for potential-based
        # shaping so standing still / spinning nets ~0 reward.
        self.last_threat_distance = self.threat_radius

        self.render_mode = render_mode

        # =========================================================
        # RANDOMIZED PHYSICS
        # =========================================================

        self.acceleration = 0.0
        self.turn_rate = 0.0

        # =========================================================
        # ENTITIES
        # =========================================================
        self.game_player = None
        self.game_friends = []
        self.weapon_names = {
            "Pulse Canon": 0,
            "Gatling Gun": 1,
            "Heavy RailGun": 2,
            "Plasma Canon": 3,
            "Homing Missile": 4,
            "Mine": 5,
            "Minature": 6,
        }

        self.ship_names = {
            "Bomber Drone": 0,
            "Fleet Drone": 1,
            "Miner Drone": 2,
            "Missile Launcher": 3,
            "Sniper": 4,
            "Tormenter Drone": 5,
        }
        self.weapon_index = 0
        WeaponManager.init()

        # =========================================================
        # EPISODE
        # =========================================================

        self.current_step = 0
        self.last_health = 1000.0
        self.last_fire = False
        self.last_distance = 0.0
        self.last_kill_score = 0
        self.last_damage_score = 0

        # =========================================================
        # ACTION SPACE
        # =========================================================

        self.action_space = spaces.Box(
            low=-1,
            high=1,
            shape=(4,),
            dtype=np.float32,
        )

        # spaces.Dict(
        #     {
        #         "movement": Box(-1, 1, (2,)),
        #         "fire": MultiBinary(1),
        #         "weapon": Discrete(num_weapons),
        #     }
        # )

        # =========================================================
        # OBSERVATION SPACE
        # =========================================================
        #
        # SELF:
        #
        # [vx, vy, heading_x, heading_y, speed, health, heat, weapon_idx]
        #
        #
        # ENEMY / WEAPON (per slot, up to K_enemies / K_weapons nearest
        # entities returned by the ship's spatial-hash queries):
        #
        # [relative_x, relative_y, relative_vx, relative_vy, distance, alignment, type]
        # =========================================================

        self.observation_space = spaces.Dict(
            {
                "self": spaces.Box(
                    low=np.array(
                        [
                            -1.0,  # vx_norm
                            -1.0,  # vy_norm
                            -1.0,  # heading_x
                            -1.0,  # heading_y
                            0.0,  # speed_norm
                            0.0,  # health_norm
                            0.0,  # heat_norm
                            0.0,  # weapon_idx_norm
                        ],
                        dtype=np.float32,
                    ),
                    high=np.array(
                        [
                            1.0,
                            1.0,
                            1.0,
                            1.0,
                            1.0,
                            1.0,
                            1.0,
                            1.0,
                        ],
                        dtype=np.float32,
                    ),
                    dtype=np.float32,
                ),
                "enemies": spaces.Box(
                    low=np.array(
                        [
                            [
                                -1.0,  # dx
                                -1.0,  # dy
                                -1.0,  # d_vx
                                -1.0,  # d_vy
                                0.0,  # distance
                                -1.0,  # alignment
                                0.0,  # type
                            ]
                        ]
                        * self.K_enemies,
                        dtype=np.float32,
                    ),
                    high=np.array(
                        [[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]] * self.K_enemies,
                        dtype=np.float32,
                    ),
                    shape=(
                        self.K_enemies,
                        7,
                    ),
                    dtype=np.float32,
                ),
                "weapons": spaces.Box(
                    low=np.array(
                        [
                            [
                                -1.0,  # dx
                                -1.0,  # dy
                                -1.0,  # d_vx
                                -1.0,  # d_vy
                                0.0,  # distance
                                -1.0,  # alignment
                                0.0,  # type
                            ]
                        ]
                        * self.K_weapons,
                        dtype=np.float32,
                    ),
                    high=np.array(
                        [[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]] * self.K_weapons,
                        dtype=np.float32,
                    ),
                    shape=(
                        self.K_weapons,
                        7,
                    ),
                    dtype=np.float32,
                ),
            }
        )

        self.window = None
        self.clock = pygame.time.Clock()
        self.render_mode = render_mode
        self.window_size = (1920, 1080)

    def _longest_distance(self):
        dwx = toroidalDelta(self.world_width / 2, 0, self.world_width)

        dwy = toroidalDelta(self.world_height / 2, 0, self.world_height)

        return np.linalg.norm(
            np.array(
                [dwx, dwy],
                dtype=np.float32,
            )
        )

    # =============================================================
    # TOROIDAL RELATIVE POSITION
    # =============================================================

    def _wrap_relative_vector(
        self,
        dx: float,
        dy: float,
    ):
        """
        Find the shortest displacement between two points
        in a toroidal world.
        """

        dx = wrap(dx, self.world_width)

        dy = wrap(dy, self.world_height)

        return dx, dy

    # =============================================================
    # NORMALIZE WORLD POSITION
    # =============================================================

    def _normalize_position(
        self,
        x: float,
        y: float,
    ):
        """
        Convert world coordinates to [-1, 1].

        0 world position -> -1
        center           -> 0
        maximum          -> +1
        """

        nx = (x / self.world_width) * 2.0 - 1.0

        ny = (y / self.world_height) * 2.0 - 1.0

        return nx, ny

    # =============================================================
    # NORMALIZE RELATIVE POSITION
    # =============================================================

    def _normalize_relative_position(
        self,
        dx: float,
        dy: float,
    ):
        """
        Normalize a relative toroidal displacement.

        -world_width / 2 -> -1
        0                 -> 0
        +world_width / 2 -> +1
        """

        nx = dx / (self.world_width / 2)

        ny = dy / (self.world_height / 2)

        return nx, ny

    # =============================================================
    # NORMALIZE ANGLE
    # =============================================================

    @staticmethod
    def _normalize_angle(angle: float):
        """
        Convert [0, 2π) to [-1, 1].

        0       -> -1
        π       ->  0
        2π      -> +1
        """

        return angle / np.pi - 1.0

    def angleAndDistance(self, other):
        dx = toroidalDelta(self.ship.x, other.x, self.world_width)

        dy = toroidalDelta(self.ship.y, other.y, self.world_height)

        relative = np.array(
            [dx, dy],
            dtype=np.float32,
        )

        target_direction = 0
        distance = np.linalg.norm(relative)
        if np.linalg.norm(distance) > 1e-6:
            target_direction = relative / distance

        heading = np.array(
            [
                -np.sin(self.ship.angle),
                -np.cos(self.ship.angle),
            ],
            dtype=np.float32,
        )

        return (
            np.dot(
                heading,
                target_direction,
            ),
            distance,
        )

    # =============================================================
    # COMBAT ACTIONS
    # =============================================================

    def _coerce_action(self, action):
        arr = np.asarray(action, dtype=np.float32).reshape(-1)
        if arr.size < 2:
            arr = np.pad(arr, (0, 2 - arr.size), constant_values=0.0)
        if arr.size < 4:
            arr = np.pad(arr, (0, 4 - arr.size), constant_values=0.0)
        return arr[:4]

    # =============================================================
    # RELATIVE ENTITY ROW (shared by enemies / weapons)
    # =============================================================

    def _relative_entity_rows(self, ship, ship_vx, ship_vy, ship_angle, entities, type_norms):
        count = len(entities)
        if count == 0:
            return np.zeros((0, 7), dtype=np.float32)

        entity_x = np.asarray([entity.x for entity in entities], dtype=np.float64)
        entity_y = np.asarray([entity.y for entity in entities], dtype=np.float64)
        entity_angle = np.asarray(
            [float(getattr(entity, "angle", 0.0)) for entity in entities],
            dtype=np.float64,
        )
        entity_speed = np.asarray(
            [float(getattr(entity, "speed", 0.0)) for entity in entities],
            dtype=np.float64,
        )
        return build_entity_rows(
            entity_x,
            entity_y,
            entity_angle,
            entity_speed,
            np.asarray(type_norms, dtype=np.float64),
            float(ship.x),
            float(ship.y),
            float(ship_vx),
            float(ship_vy),
            float(ship_angle),
            self.world_width,
            self.world_height,
            self.max_speed,
            self._longest_distance(),
        )

    def _get_obs(self):
        ship = self.game_player

        ship_speed = float(getattr(ship, "speed", 0.0))
        ship_angle = float(getattr(ship, "angle", 0.0))
        ship_vx = -np.sin(ship_angle) * ship_speed
        ship_vy = -np.cos(ship_angle) * ship_speed
        heading_x = -np.sin(ship_angle)
        heading_y = -np.cos(ship_angle)
        health = float(getattr(ship, "life", 1000.0))
        health_norm = np.clip(health / 1000.0, 0.0, 1.0)
        heat = float(getattr(ship, "heat", 0.0))
        heat_norm = np.clip(heat / max(getattr(ship, "maxHeat", 1000.0), 1.0), 0.0, 1.0)
        weapon_norm = self.weapon_index / (len(self.weapon_names) - 1)

        self_vec = np.array(
            [
                np.clip(ship_vx / self.max_speed, -1.0, 1.0),
                np.clip(ship_vy / self.max_speed, -1.0, 1.0),
                heading_x,
                heading_y,
                np.clip(ship_speed / self.max_speed, 0.0, 1.0),
                health_norm,
                heat_norm,
                weapon_norm,
            ],
            dtype=np.float32,
        )

        # ----------------------------------------------------------
        # Enemies: query the ship's spatial hash instead of iterating
        # every ship ShipManager knows about. ShipManager.ships can
        # be any size, so we only ever want the nearby subset within
        # view_radius, capped to the K_enemies observation slots.
        # ----------------------------------------------------------
        near_enemies = sorted(
            ship.getNearPlayers(self.view_radius),
            key=lambda enemy: toroidalDistance(
                enemy.x,
                enemy.y,
                ship.x,
                ship.y,
            ),
        )
        near_enemies = near_enemies[: self.K_enemies]
        enemies_mat = np.zeros((self.K_enemies, 7), dtype=np.float32)
        enemy_types = [
            self.ship_names.get(enemy.name, 0) / max(len(self.ship_names) - 1, 1)
            for enemy in near_enemies
        ]
        enemies_mat[: len(near_enemies)] = self._relative_entity_rows(
            ship, ship_vx, ship_vy, ship_angle, near_enemies, enemy_types
        )

        # ----------------------------------------------------------
        # Weapons: same idea, but sourced from the spatial hash of
        # live weapon/projectile instances (WeaponManager can also
        # hold any number of active weapons at a time).
        # ----------------------------------------------------------
        near_weapons = sorted(
            ship.getNearWeapons(self.threat_radius),
            key=lambda weapon: toroidalDistance(
                weapon.x,
                weapon.y,
                ship.x,
                ship.y,
            ),
        )
        near_weapons = near_weapons[: self.K_weapons]
        weapons_mat = np.zeros((self.K_weapons, 7), dtype=np.float32)
        weapon_types = [
            self.weapon_names.get(weapon.name, 0) / max(len(self.weapon_names) - 1, 1)
            for weapon in near_weapons
        ]
        weapons_mat[: len(near_weapons)] = self._relative_entity_rows(
            ship, ship_vx, ship_vy, ship_angle, near_weapons, weapon_types
        )

        return {
            "self": self_vec,
            "enemies": enemies_mat,
            "weapons": weapons_mat,
        }

    # =============================================================
    # RESET
    # =============================================================

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        if seed is not None:
            np.random.seed(seed)
        WeaponManager.weapons.clear()
        spatial.clear()
        self.game_player = player.PlayerShip.spawn(
            self.world_width / 2,
            self.world_height / 2,
            controllable=True,
        )
        ShipManager.init(self.K_enemies)
        world.attach(self.game_player)
        self._sync_spatial()

        self.acceleration = float(getattr(self.game_player, "acceleration", 3500.0))
        self.turn_rate = float(getattr(self.game_player, "turnRate", 2.0))
        self.max_speed = float(getattr(self.game_player, "maxSpeed", 5000.0))
        self.current_step = 0
        self.last_health = float(getattr(self.game_player, "life", 1000.0))
        self.last_distance = 0.0
        self.last_kill_score = 0
        self.last_damage_score = 0
        self.last_threat_distance = self.threat_radius
        observation = self._get_obs()
        return observation, {
            "acceleration": self.acceleration,
            "turn_rate": self.turn_rate,
        }

    # =============================================================
    # STEP
    # =============================================================

    def step(self, action):
        self.current_step += 1
        action = self._coerce_action(action)
        thrust = float(np.clip(action[0], -1.0, 1.0))
        turn = float(np.clip(action[1], -1.0, 1.0))
        fire_signal = float(action[2] > 0.5)
        weapon_signal = float(action[3])

        ship = self.game_player

        self.last_health = float(getattr(ship, "life", 1000.0))
        self.last_fire = False

        self.game_player.set_weapon(weapon_signal)

        self._sync_spatial()
        world.update()
        WeaponManager.update(self.current_step, self.dt)

        # Physics update still runs over every enemy ShipManager is
        # tracking (this is a full-world tick, not an observation
        # query), regardless of how many/what size they are.
        for enemy in ShipManager.ships:
            enemy_turn = self.np_random.uniform(-1.0, 1.0)
            enemy_thrust = self.np_random.uniform(-0.5, 1.0)
            enemy.update(
                self.current_step, self.dt, thrust=enemy_thrust, turn=enemy_turn
            )

        self.game_player.update(self.current_step, self.dt, thrust=thrust, turn=turn)
        if fire_signal > 0.5 and hasattr(self.game_player, "fire"):
            self.game_player.fire()
            self.last_fire = True

        self._sync_spatial()

        reward, distance, alignment = self._calculate_reward()

        self.last_distance = distance
        terminated = self.game_player.life <= 0 or (len(ShipManager.ships) < 1)
        truncated = self.current_step >= self.max_episode_steps
        observation = self._get_obs()
        info = {
            "step": self.current_step,
            "speed": getattr(self.game_player, "speed", 0.0),
            "angle": getattr(self.game_player, "angle", 0.0),
            "acceleration": self.acceleration,
            "turn_rate": self.turn_rate,
            "distance": distance,
            "alignment": alignment,
            "weapon": self.weapon_index,
        }

        if self.current_step > 50_000_000:
            self.w_progress = 1
            self.w_alignment = 0.5
        elif self.current_step > 100_000_000:
            self.w_progress = 0
            self.w_alignment = 0

        return observation, reward, terminated, truncated, info

    def _sync_spatial(self):
        spatial.clear()
        spatial.insert(self.game_player)
        spatial.insertAll(ShipManager.ships, WeaponManager.weapons)

    def _nearest(self, ship, entities):
        """Return (entity, distance) for the closest entity in a list, or (None, None)."""
        if not entities:
            return None, None
        best = min(
            entities,
            key=lambda e: toroidalDistance(e.x, e.y, ship.x, ship.y),
        )
        return best, float(toroidalDistance(best.x, best.y, ship.x, ship.y))

    def _calculate_reward(self):
        ship = self.game_player
        if ship is None:
            return 0.0, self.last_distance, 0.0

        longest = max(self._longest_distance(), 1.0)
        heading = np.array([-np.sin(ship.angle), -np.cos(ship.angle)], dtype=np.float32)
        heading /= max(np.linalg.norm(heading), 1e-6)

        # ==========================================================
        # ENGAGEMENT — approach + face the nearest enemy.
        # Spatial-hash query (not the raw ShipManager population) so
        # this scales the same whether there are 3 enemies or 3000.
        # Potential-based on distance: reward = how much closer we got
        # since last step, so orbiting at a fixed range nets ~0 rather
        # than a free per-step bonus.
        # ==========================================================
        near_enemies = sorted(
            ship.getNearPlayers(self.view_radius),
            key=lambda enemy: toroidalDistance(
                enemy.x,
                enemy.y,
                ship.x,
                ship.y,
            ),
        )
        target, distance = self._nearest(ship, near_enemies)

        if target is not None:
            dx = toroidalDelta(target.x, ship.x, self.world_width)
            dy = toroidalDelta(target.y, ship.y, self.world_height)
            relative = np.array([dx, dy], dtype=np.float32)
            target_dir = (
                relative / distance
                if distance > 1e-6
                else np.array([1.0, 0.0], dtype=np.float32)
            )
            alignment = float(np.clip(np.dot(heading, target_dir), -1.0, 1.0))
            progress = (self.last_distance - distance) / longest
        else:
            # No enemy in range at all: no target to chase, so no
            # progress/alignment signal — don't fabricate one, and
            # don't let self.last_distance decay toward zero either.
            distance = self.last_distance
            alignment = 0.0
            progress = 0.0

        engagement_reward = self.w_progress * progress + self.w_alignment * alignment

        target_reward = 0.0
        # if target is not None:
        #     if distance < 250:
        #         target_reward += 2.0
        #     if distance < 100:
        #         target_reward += 5.0

        # ==========================================================
        # THREAT AVOIDANCE — dodge nearby weapons/projectiles.
        # Also potential-based: reward is proportional to how much
        # farther the nearest threat got this step, clipped to
        # threat_radius so a threat leaving view entirely doesn't
        # produce one giant spike. A flat proximity penalty is layered
        # on top so lingering deep inside the danger radius still
        # costs something even between shaping ticks.
        # ==========================================================
        near_weapons = sorted(
            ship.getNearWeapons(self.threat_radius),
            key=lambda weapon: toroidalDistance(
                weapon.x,
                weapon.y,
                ship.x,
                ship.y,
            ),
        )
        _, threat_distance = self._nearest(ship, near_weapons)

        if threat_distance is not None:
            threat_shaping = (
                threat_distance - self.last_threat_distance
            ) / self.threat_radius
            threat_shaping = float(np.clip(threat_shaping, -1.0, 1.0))
            proximity = 1.0 - np.clip(threat_distance / self.threat_radius, 0.0, 1.0)
            self.last_threat_distance = threat_distance
        else:
            # Nothing dangerous nearby right now — no shaping delta,
            # and reset the tracker so re-entering danger next step
            # doesn't get scored against a stale close distance.
            threat_shaping = 0.0
            proximity = 0.0
            self.last_threat_distance = self.threat_radius

        threat_reward = (
            self.w_threat_shaping * threat_shaping - self.w_threat_proximity * proximity
        )

        # ==========================================================
        # DAMAGE / KILLS / DEATH
        # ==========================================================
        current_health = float(ship.life)
        damage_taken = max(0.0, self.last_health - current_health)
        damage_penalty = -self.w_damage_taken * damage_taken

        damage_dealt = getattr(ship, "damage_score", 0.0) - self.last_damage_score
        damage_reward = self.w_damage_dealt * damage_dealt
        self.last_damage_score = getattr(ship, "damage_score", 0.0)

        kills = getattr(ship, "killScore", 0) - self.last_kill_score
        kill_reward = self.w_kill * max(0, kills)
        self.last_kill_score = getattr(ship, "killScore", 0)

        win_reward = self.w_win if len(ShipManager.ships) < 1 else 0.0
        death_penalty = -self.w_death if current_health <= 0 else 0.0

        # ==========================================================
        # TIME
        # ==========================================================
        timeout_penalty = (
            -self.timeout_penalty
            if self.current_step >= self.max_episode_steps
            else 0.0
        )

        # ==========================================================
        # FINAL
        # ==========================================================
        reward = (
            engagement_reward
            + target_reward
            + threat_reward
            + damage_reward
            + kill_reward
            + win_reward
            + damage_penalty
            + death_penalty
            + self.living_reward
            - self.time_penalty
            + timeout_penalty
        )

        self.last_distance = distance
        self.last_health = current_health

        return reward, distance, alignment

    # =============================================================
    # RENDER
    # =============================================================
    def render(self):
        if self.render_mode in ("human", "rgb_array"):
            if not pygame.get_init():
                pygame.init()
            self.window = get_screen()
            clear((0, 0, 0))
            world.render()
            WeaponManager.render()
            self.game_player.render()
            ShipManager.render()

            draw_text(
                (
                    f"Ships Alive: {len(ShipManager.ships)} - Destroyed: 0 - "
                    f"Kill: {getattr(player.ship, 'killScore', 0)} Weapon name: "
                    f"{getattr(getattr(player.ship, 'weapon', None), 'name', '')} heat: "
                    f"{int((getattr(player.ship, 'heat', 0) / max(getattr(player.ship, 'maxHeat', 1), 1)) * 100)}"
                ),
                (10, 20),
                color="white",
                size=20,
            )
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    self.window = None
                    return None

            pygame.display.flip()
            if self.clock is not None:
                self.clock.tick(self.metadata["render_fps"])
            if self.render_mode == "rgb_array":
                return np.transpose(pygame.surfarray.array3d(self.window), (1, 0, 2))
            return None

        return None

    # =============================================================
    # CLOSE
    # =============================================================

    def close(self):
        if self.window is not None or pygame.get_init():
            pygame.quit()
            self.window = None
