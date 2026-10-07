from __future__ import annotations

from uuid import uuid4

from core.events.keys import keys
from core.ships.shapes import shapes
from core.utils.constants import FIXED_DT
from core.utils.math import clamp
from core.utils.vertices import createVerticesPath, tranformVertices
from core.weapons.manager import WeaponManager, weaponManager
from core.world.canvas import draw_line, draw_polygon
from core.world.utils import lerp, worldToScreen
from core.world.world import world
import numpy as np

from core.world.utils import lerp, toroidalDelta, toroidalDirection, toroidalDistance, wrap
from core.world.spatial_hash import spatial


destroyedShips: list = []


class Ship:
    squad_targets: dict[bool, "Ship"] = {}

    def __init__(self, **options):
        from core.weapons.pulse_canon import PulseCanon
        self.id = str(uuid4())
        self.x = options.get("x", 0)
        self.y = options.get("y", 0)
        self.speed = 0
        self.acceleration = options.get("acceleration", 3500)
        self.width = options.get("width", 40)
        self.height = options.get("height", 40)
        self.angle = options.get("angle", 0)
        self.color = options.get("color", "red")
        self.turnRate = options.get("turnRate", 2)
        self.name = options.get("name", "Player")
        self.friend = options.get("friend", False)
        self.dampSpeed = 0.75 ** FIXED_DT
        self.dt = FIXED_DT
        self.controllable = options.get("controllable", False)
        self.lastTime = 0
        self.weapon = options.get("weapon", PulseCanon)
        self.killScore = 0
        self.damage_score = 0
        self.vertices = options.get("vertices", shapes[0])
        self.path2D = createVerticesPath(tranformVertices(self.vertices, 0, 0, self.width, self.height, 0))
        self.life = options.get("life", 100)
        self.fullLife = self.life
        self.cooldown = 0
        self.heat = 0
        self.maxHeat = options.get("maxWeaponHeat", 10000)
        self.weaponState = "cool"
        self.state = "idle"
        self.target = None
        self.lastDt = FIXED_DT
        self.seekAcceleration = self.acceleration
        self.fleeAcceleration = self.acceleration * 1.2
        self.maxSpeed = (self.dampSpeed * self.acceleration * FIXED_DT) / (1 - self.dampSpeed)
        self.speed_factor = 0

    @property
    def maxLife(self):
        return self.fullLife
        
    def render(self):
        draw_polygon(self.getVertices(), color=self.color, width=0, alpha=255)

        life_ratio = max(0.0, min(1.0, self.life / max(self.fullLife, 1)))
        bar_length = max(self.width * 0.7, 28)
        screen_pos = worldToScreen(self.x, self.y)
        forward_x = np.sin(self.angle)
        forward_y = -np.cos(self.angle)
        head_x = screen_pos["x"] + forward_x * (self.height * 0.8)
        head_y = screen_pos["y"] + forward_y * (self.height * 0.8)

        bar_start_x = head_x - (bar_length /2)
        bar_start_y = head_y - 50
        bar_end_x = head_x + (bar_length / 2)
        bar_end_y = head_y - 50

        draw_line((bar_start_x, bar_start_y), (bar_end_x, bar_end_y), color=(50, 50, 50), width=4, alpha=180)
        fill_end_x = bar_start_x + bar_length * life_ratio
        draw_line((bar_start_x, bar_start_y), (fill_end_x, bar_end_y), color="springgreen", width=4, alpha=255)

    def update(self, t, dt, thrust=0, turn=0):
        self.lastDt = dt
        steering = turn
        thrusting = thrust if self.state == "AI" else 1
        external_control = self.controllable and (thrust != 0 or turn != 0)
        self.speed_factor = clamp(np.sqrt(self.speed / self.maxSpeed), 0, 1) if self.maxSpeed else 0
        if self.controllable:
            if external_control:
                steering = turn
                if thrust > 0:
                    self.speed += self.acceleration * dt * thrust
                elif thrust < 0:
                    self.speed = max(self.speed + self.acceleration * dt * thrust, 0)
                if keys.get(" ") or keys.get("Enter") or keys.get("Space"):
                    self.fire()
            else:
                if keys.get("ArrowLeft"):
                    steering = 1
                if keys.get("ArrowRight"):
                    steering = -1
                if keys.get("ArrowUp"):
                    self.speed += self.acceleration * dt
                if keys.get("ArrowDown"):
                    self.speed = max(self.speed - self.acceleration * dt, 0)
                if keys.get(" ") or keys.get("Enter") or keys.get("Space"):
                    self.fire()
        elif self.state != "idle":
            self.speed = max(self.speed + thrusting * self.acceleration * dt, 0)
        else:
            self.speed += self.acceleration * dt

        self.angle = wrap(self.angle + (steering * self.turnRate * self.speed_factor * dt), 6.283185307179586)
        self.speed = max(self.speed * self.dampSpeed, 0)
        self.x = wrap(self.x - np.sin(self.angle) * (self.speed * dt), world.width)
        self.y = wrap(self.y - np.cos(self.angle) * (self.speed * dt), world.height)
        if self.cooldown >= 0:
            self.cooldown -= 1
        self.heat = clamp(self.heat - (self.maxHeat * 0.001), 0, self.maxHeat * 5)
        if self.weaponState == "cool" and self.heat >= self.maxHeat:
            self.weaponState = "hot"
        elif self.weaponState == "hot" and self.heat <= 0:
            self.weaponState = "cool"

    def randomMotion(self, t, dt, fire=True):
        self.speed = self.speed + (self.acceleration * dt)
        if not self.lastTime:
            self.lastTime = t
        if t - self.lastTime > np.random.uniform(0.1, 2):
            prev_angle = self.angle
            self.angle = wrap(self.angle + (np.random.choice([-self.turnRate, self.turnRate]) * self.speed_factor * FIXED_DT), np.pi * 2)
            self.lastTime = t
            
        if fire and t - self.lastTime > np.random.uniform(1, 3):
            self.fire()
            
        if t - self.lastTime > np.random.uniform(1, 3):
            weaponManager.nextWeapon()

    def canFire(self):
        return self.cooldown <= 0 and self.heat < self.maxHeat and self.weaponState == "cool"

    def fire(self):
        if not self.canFire():
            return

        fire_distance = -100 if self.weapon.__name__ == "Mine" else 10
        fire_x = wrap(self.x - np.sin(self.angle) * fire_distance, world.width)
        fire_y = wrap(self.y - np.cos(self.angle) * fire_distance, world.height)
        self.fireFrom(fire_x, fire_y, self.angle)

    def fireFrom(self, x, y, angle):
        if not self.canFire():
            return False

        from core.weapons.manager import WeaponManager

        prop = {
                "x": wrap(x - np.sin(angle) * self.width / 2, world.width),
                "y": wrap(y - np.cos(angle) * self.height / 2, world.height),
                "angle": angle,
                "speed": self.speed,
                "ship": self,
                "color": "#33cfff" if self.name == "Player" else "red",
            }
        
        WeaponManager.fire(self.weapon, **prop)
        return True

    def setCoolDown(self, val):
        self.cooldown = val

    def increaseHeat(self, val):
        self.heat += val

    def setMaxHeat(self):
        self.weaponState = "hot"

    def destroy(self):
        from core.ships.manager import ShipManager

        ShipManager.destroy(self)

    def getVertices(self):
        screen = worldToScreen(self.x, self.y)
        return tranformVertices(self.vertices, screen["x"], screen["y"], self.width, self.height, self.angle)

    def set_weapon(self, idx):
        WeaponManager.changeWeapon(idx)
        
    def getNearestWeapon(self):
        from core.weapons.weapon import Weapon
        
        object_list = spatial.query(
            self.x, self.y, np.ceil(self.height / spatial.cellSize) + 1
        )
        nearest_weapon = None
        nearest_distance = float("inf")
        for weapon in object_list:
            if isinstance(weapon, Weapon) and weapon.ship is not self:
                dist = toroidalDistance(weapon.x, weapon.y, self.x, self.y)
                if dist < nearest_distance:
                    nearest_distance = dist
                    nearest_weapon = weapon
        return nearest_weapon

    def getNearestEnemy(self):
        object_list = spatial.query(
            self.x, self.y)
        nearest_enemy = None
        nearest_distance = float("inf")
        for obj in object_list:
            if isinstance(obj, Ship) and obj is not self:
                dist = toroidalDistance(obj.x, obj.y, self.x, self.y)
                if dist < nearest_distance:
                    nearest_distance = dist
                    nearest_enemy = obj
        return nearest_enemy
    
        
    def getNearWeapons(self, radius):
        from core.weapons.weapon import Weapon
        
        object_list = spatial.query(
            self.x, self.y)

        weapons = []
        for weapon in object_list:
            if isinstance(weapon, Weapon) and weapon.ship is not self:
                dist = toroidalDistance(weapon.x, weapon.y, self.x, self.y)
                if dist <= radius:
                    weapons.append(weapon)
        return weapons
    
    def getNearPlayers(self, radius):
        object_list = spatial.query(
            self.x, self.y)

        players = []
        for obj in object_list:
            if isinstance(obj, Ship) and obj is not self:
                dist = toroidalDistance(obj.x, obj.y, self.x, self.y)
                if dist <= radius:
                    players.append(obj)
        return players    
    
    def closeWeapon(self, weapon, dist, alpha):
        if dist > 7**7:
            return
        if abs(alpha - np.pi / 2) < np.pi / 16:
            self.fire()
        beta = alpha + np.pi / 2
        delta = np.atan2(np.sin(beta), -np.cos(beta))
        self.angle = wrap(lerp(self.angle, self.angle - clamp(delta, self.turnRate) * FIXED_DT * self.speed_factor, 0.3), np.pi * 2)

    def nearByWeapon(self):
        from core.weapons.weapon import Weapon
        
        object_list = spatial.query(
            self.x, self.y)
        for weapon in object_list:
            if isinstance(weapon, Weapon) and weapon.ship is not self:
                dist = toroidalDistance(weapon.x, weapon.y, self.x, self.y)
                if dist > 8**8:
                    continue
                alpha = toroidalDirection(
                    weapon.x, weapon.y, self.x, self.y, self.angle
                )
                self.closeWeapon(weapon, dist, alpha)

    def follow(self, ship):
        tangent = np.pi / 2 if self.state == "flee" else -np.pi / 2
        delta = toroidalDirection(
            ship.x, ship.y, self.x, self.y, self.angle, tangent
        )
        self.angle = wrap(
            lerp(
                self.angle,
                self.angle - clamp(delta, -self.turnRate, self.turnRate) * self.lastDt * self.speed_factor,
                0.9,
            ),
            np.pi * 2,
        )
        return delta

    def nearByTarget(self, radius=12000):
        if self.target is not None and getattr(self.target, "state", None) != "dead" and self.target.life > 0:
            current_distance = toroidalDistance(self.target.x, self.target.y, self.x, self.y)
            if current_distance <= radius * radius * 4:
                return

        closest = None
        closest_distance = float("inf")
        for candidate in spatial.query(self.x, self.y, radius):
            if not isinstance(candidate, Ship) or candidate is self:
                continue
            if candidate.friend == self.friend or getattr(candidate, "state", None) == "dead" or candidate.life <= 0:
                continue
            distance = toroidalDistance(candidate.x, candidate.y, self.x, self.y)
            if distance <= radius * radius and distance < closest_distance:
                closest = candidate
                closest_distance = distance
        if closest is not None:
            self.target = closest

    @classmethod
    def getSquadTarget(cls, friend):
        target = cls.squad_targets.get(friend)
        if target is None or target.state == "dead" or target.life <= 0:
            cls.squad_targets.pop(friend, None)
            return None
        return target

    @classmethod
    def setSquadTarget(cls, friend, target):
        cls.squad_targets[friend] = target

    def findThreat(self, radius=1000):
        from core.weapons.weapon import Weapon

        best = None
        for obj in spatial.query(self.x, self.y, radius):
            if not isinstance(obj, Weapon) or obj.ship is self or not obj.active:
                continue
            if getattr(obj.ship, "friend", self.friend) == self.friend:
                continue

            dx = toroidalDelta(obj.x, self.x, world.width)
            dy = toroidalDelta(obj.y, self.y, world.height)
            forward_x = -np.sin(obj.angle)
            forward_y = -np.cos(obj.angle)
            forward_distance = dx * forward_x + dy * forward_y
            lateral_distance = abs(dx * forward_y - dy * forward_x)
            distance = np.sqrt(dx * dx + dy * dy)

            if obj.speed <= 1 or obj.name == "Mine":
                if distance > 500:
                    continue
                threat = (distance / max(obj.speed, 1), distance, obj)
            else:
                time_to_hit = forward_distance / obj.speed
                collision_radius = self.width * 0.75 + obj.width + 80
                if forward_distance <= 0 or time_to_hit > 1.5 or lateral_distance > collision_radius:
                    continue
                threat = (time_to_hit, distance, obj)
            if best is None or threat[0] < best[0]:
                best = threat
        return best

    def evadeThreat(self, threat):
        weapon = threat[2]
        forward_x = -np.sin(weapon.angle)
        forward_y = -np.cos(weapon.angle)
        dx = toroidalDelta(weapon.x, self.x, world.width)
        dy = toroidalDelta(weapon.y, self.y, world.height)
        side = 1 if dx * forward_y - dy * forward_x >= 0 else -1
        evade_x = -forward_y * side
        evade_y = forward_x * side
        self.state = "evade"
        self.acceleration = self.fleeAcceleration
        return self.steerTo(np.arctan2(-evade_x, -evade_y), 1.5)

    def steerTo(self, angle, multiplier=1):
        delta = np.arctan2(np.sin(angle - self.angle), np.cos(angle - self.angle))
        self.angle = wrap(
            self.angle + clamp(delta, -self.turnRate * multiplier, self.turnRate * multiplier) * self.lastDt,
            np.pi * 2,
        )
        return delta

    def angleToTarget(self, target, lead=0):
        dx = toroidalDelta(self.x, target.x, world.width)
        dy = toroidalDelta(self.y, target.y, world.height)
        lead_x = -np.sin(target.angle) * target.speed * lead
        lead_y = -np.cos(target.angle) * target.speed * lead
        return np.arctan2(-(dx + lead_x), -(dy + lead_y))

    def tacticalUpdate(self, *, searchRange=12000, idealRange=2500, fleeRange=0, fireRange=5000, fireArc=np.pi / 12, orbit=0, lead=0, turnMultiplier=1, fire=True, threatRange=1000):
        threat = self.findThreat(threatRange)
        if threat is not None:
            self.evadeThreat(threat)
            weapon = threat[2]
            threat_angle = np.arctan2(
                -toroidalDelta(self.x, weapon.x, world.width),
                -toroidalDelta(self.y, weapon.y, world.height),
            )
            aim_error = abs(np.arctan2(np.sin(threat_angle - self.angle), np.cos(threat_angle - self.angle)))
            if threat[1] <= 3200 and aim_error <= np.pi / 5:
                self.fireFrom(self.x, self.y, threat_angle)
            return {"distance": threat[1], "targetAngle": threat_angle, "delta": aim_error}

        self.nearByTarget(searchRange)
        if self.target is None or getattr(self.target, "state", None) == "dead" or self.target.life <= 0:
            self.target = None
            self.state = "idle"
            self.acceleration = self.seekAcceleration
            return None

        distance = np.sqrt(toroidalDistance(self.x, self.y, self.target.x, self.target.y))
        fleeing = fleeRange > 0 and distance < fleeRange
        self.state = "flee" if fleeing else ("seek" if distance > idealRange else "orbit")
        self.acceleration = self.fleeAcceleration if fleeing else self.seekAcceleration
        target_angle = self.angleToTarget(self.target, lead)
        firing_window = fire and not fleeing and distance <= fireRange
        steering_angle = target_angle + np.pi if fleeing else target_angle if firing_window else target_angle + orbit * np.pi / 2
        delta = self.steerTo(steering_angle, turnMultiplier)
        aim_error = abs(np.arctan2(np.sin(target_angle - self.angle), np.cos(target_angle - self.angle)))
        if firing_window and aim_error <= fireArc:
            self.fire()
        return {"distance": distance, "targetAngle": target_angle, "delta": delta}
