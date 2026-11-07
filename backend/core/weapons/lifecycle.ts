import type Weapon from "./weapon.ts";

type DestroyHandler = (weapon: Weapon) => void;
type FireHandler = (weapon: typeof Weapon, options: WeaponC) => void;

let destroyHandler: DestroyHandler | undefined;
let fireHandler: FireHandler | undefined;

export function registerWeaponDestroyHandler(handler: DestroyHandler) {
  destroyHandler = handler;
}

export function destroyWeapon(weapon: Weapon) {
  destroyHandler?.(weapon);
}

export function registerWeaponFireHandler(handler: FireHandler) {
  fireHandler = handler;
}

export function fireWeapon(weapon: typeof Weapon, options: WeaponC) {
  fireHandler?.(weapon, options);
}
