import { worldSize } from "../utils/constants.ts";
import type Ship from "../ships/ship.ts";

export default class World {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public scale: number;
    public ship: Ship | null;
    public angle: number;

    constructor({ x, y, width, height, scale = 1, ship = null }: WorldC) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.scale = scale;
        this.ship = ship;
        this.angle = 0;
    }
}


export const world = new World({
    x: 0,
    y: 0,
    width: worldSize.width,
    height: worldSize.height,
    scale: 0.3,
})