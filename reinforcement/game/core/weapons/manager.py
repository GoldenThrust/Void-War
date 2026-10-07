from __future__ import annotations

from core.events.keybind import keybinds
from core.world.manager import worldManager
import numpy as np


class WeaponManager:
    weapons: list = []
    weaponTypes: list = []

    def __init__(self):
        self._addKeybinds()

    @staticmethod
    def fire(Weapon, **options):
        WeaponManager.weapons.append(Weapon(**options))

    @staticmethod
    def render():
        for weapon in WeaponManager.weapons:
            weapon.render()

    @staticmethod
    def update(t, dt):
        for weapon in list(WeaponManager.weapons):
            weapon.update(t, dt)

    @staticmethod
    def destroy(weapon):
        if weapon in WeaponManager.weapons:
            WeaponManager.weapons.remove(weapon)

    def _addKeybinds(self):
        keybinds["q"] = self.previousWeapon
        keybinds["e"] = self.nextWeapon

    @staticmethod
    def init():
        from core.weapons.pulse_canon import PulseCanon
        from core.weapons.gatling_gun import GatlingGun
        from core.weapons.heavy_rail_gun import HeavyRailGun
        from core.weapons.plasma_canon import PlasmaCanon
        from core.weapons.homing_missile import HomingMissile
        from core.weapons.mine import Mine

        WeaponManager.weaponTypes = [
            PulseCanon,
            GatlingGun,
            HeavyRailGun,
            PlasmaCanon,
            HomingMissile,
            Mine,
        ]
    
    @staticmethod
    def _getWeaponTypes():
        return WeaponManager.weaponTypes

    def nextWeapon(self):
        weaponTypes = WeaponManager._getWeaponTypes()
        ship = worldManager.findAttachedShip()
        currentWeaponId = (
            weaponTypes.index(ship.weapon) + 1
            if ship and ship.weapon in weaponTypes
            else 0
        )
        nextWeapon = (
            weaponTypes[currentWeaponId]
            if currentWeaponId < len(weaponTypes)
            else weaponTypes[0]
        )
        self.changeWeapon(nextWeapon)

    def previousWeapon(self):
        weaponTypes = WeaponManager._getWeaponTypes()
        ship = worldManager.findAttachedShip()
        currentWeaponId = (
            weaponTypes.index(ship.weapon) - 1
            if ship and ship.weapon in weaponTypes
            else -1
        )
        previousWeapon = (
            weaponTypes[currentWeaponId]
            if currentWeaponId >= 0
            else weaponTypes[-1]
        )
        self.changeWeapon(previousWeapon)

    @staticmethod
    def changeWeapon(weapon_idx_norm):
        weaponTypes = WeaponManager._getWeaponTypes()

        target_weapon = None
        if isinstance(weapon_idx_norm, type) and weapon_idx_norm in weaponTypes:
            target_weapon = weapon_idx_norm
        else:
            norm_value = float(np.clip(weapon_idx_norm, -1.0, 1.0))
            idx = int(np.round((norm_value + 1.0) / 2.0 * (len(weaponTypes) - 1)))
            target_weapon = weaponTypes[int(np.clip(idx, 0, len(weaponTypes) - 1))]

        from core.world.manager import worldManager
        ship = worldManager.findAttachedShip()
        if ship is not None:
            ship.weapon = target_weapon


weaponManager = WeaponManager()
