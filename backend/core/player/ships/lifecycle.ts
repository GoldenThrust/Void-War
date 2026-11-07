import type Ship from "./ship.ts";

type DestroyHandler = (ship: Ship) => void;
type QueryHandler = () => Iterable<Ship>;

let destroyHandler: DestroyHandler | undefined;
let queryHandler: QueryHandler | undefined;

export function registerShipDestroyHandler(handler: DestroyHandler) {
  destroyHandler = handler;
}

export function destroyShip(ship: Ship) {
  destroyHandler?.(ship);
}

export function registerShipQueryHandler(handler: QueryHandler) {
  queryHandler = handler;
}

export function getShips(): Iterable<Ship> {
  return queryHandler?.() ?? [];
}
