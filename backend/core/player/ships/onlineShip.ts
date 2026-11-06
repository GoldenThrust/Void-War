import Ship from "./ship.ts";

export default class OnlineShip extends Ship {
    constructor(prop: ShipC) {
        super(prop);
    }

    update(_t: number, _dt: number): void {}
}