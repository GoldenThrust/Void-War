from __future__ import annotations

from core.events.keys import keys
from core.player.ships.shapes import shapes
from core.utils.constants import FIXED_DT
from core.utils.math import clamp
from core.utils.vertices import createVerticesPath, tranformVertices
from core.weapons.manager import WeaponManager, weaponManager
from core.world.canvas import blit_image, draw_line, draw_polygon
from core.world.utils import lerp, worldToScreen
from core.world.world import world
import numpy as np

from core.world.utils import lerp, toroidalDirection, toroidalDistance, wrap
from core.world.spatial_hash import spatial


destroyedShips: list = []


class Ship:
    def __init__(self, *, x, y, width, height, angle, img=None, flameImg=None, weapon=None, acceleration=1000, turnRate=4, life=100, vertices=None, color="red", name="Player", controllable=False, maxWeaponHeat=10000):
        from core.weapons.pulse_canon import PulseCanon
        print(turnRate)
        self.x = x
        self.y = y
        self.speed = 0
        self.acceleration = acceleration
        self.width = width
        self.height = height
        self.angle = angle
        self.color = color
        self.turnRate = turnRate
        self.name = name
        self.img = img
        self.flameImg = flameImg
        self.dampSpeed = 0.75 ** FIXED_DT
        self.dt = FIXED_DT
        self.controllable = controllable
        self.lastTime = 0
        self.weapon = weapon or PulseCanon
        self.killScore = 0
        self.damage_score = 0
        self.vertices = vertices or shapes[0]
        self.path2D = createVerticesPath(tranformVertices(self.vertices, 0, 0, self.width, self.height, 0))
        self.life = life
        self.fullLife = life
        self.cooldown = 0
        self.heat = 0
        self.maxHeat = maxWeaponHeat
        self.weaponState = "cool"
        self.maxSpeed = (self.dampSpeed * self.acceleration * FIXED_DT) / (1 - self.dampSpeed)
        self.speed_factor = np.sqrt(self.speed / self.maxSpeed) if self.maxSpeed else 0
        
    def render(self):
        if self.img is not None:
            if self.speed > 50 and self.flameImg is not None:
                flame_alpha = max(0, min(255, int((self.speed / 200) * 255)))
                blit_image(self.flameImg, (self.x, self.y), size=(self.width, self.height), angle=self.angle, alpha=flame_alpha)
            blit_image(self.img, (self.x, self.y), size=(self.width, self.height), angle=self.angle)
        else:
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
        steering = turn
        thrusting = thrust if getattr(self, "state", None) == "AI" else 1
        external_control = self.controllable and (thrust != 0 or turn != 0)
        self.speed_factor = np.sqrt(self.speed / self.maxSpeed) if self.maxSpeed else 0
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
        elif getattr(self, "state", None) == "idle":
            self.randomMotion(t, dt, True)
        elif getattr(self, "state", None) == "AI":
            self.speed = max(self.speed + thrusting * self.acceleration * dt, 0)

        self.angle = wrap(self.angle + (steering * self.turnRate * self.speed_factor * FIXED_DT), 6.283185307179586)
        self.speed = max(self.speed * self.dampSpeed, 0)
        self.x = wrap(self.x + np.sin(self.angle) * (self.speed * dt), world.width)
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
        
        from core.weapons.manager import WeaponManager

        prop = {
            "x": self.x + np.sin(self.angle) * self.width / 2,
            "y": self.y - np.cos(self.angle) * self.height / 2,
            "angle": self.angle,
            "speed": self.speed,
            "ship": self,
            "color": "#33cfff" if self.name == "Player" else "red",
        }
        WeaponManager.fire(self.weapon, prop)

    def setCoolDown(self, val):
        self.cooldown = val

    def increaseHeat(self, val):
        self.heat += val

    def setMaxHeat(self):
        self.weaponState = "hot"

    def destroy(self):
        pass

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
