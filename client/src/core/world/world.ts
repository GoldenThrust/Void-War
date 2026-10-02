import { canvas, ctx, resizeCanvas } from "./canvas.ts";
import { toroidalDelta, wrap } from "./utils.ts";
import { worldSize } from "../utils/constants.ts";
import type Ship from "../player/ships/ship.ts";

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

    render() {
        resizeCanvas(this.scale);
        ctx.translate((canvas.width - this.width) / 2, (canvas.height - this.height) / 2);
    }

    update() {
        if (!this.ship) return;
        this.x = wrap(this.x + toroidalDelta(this.x, this.ship.x, this.width) * 0.15, this.width);
        this.y = wrap(this.y + toroidalDelta(this.y, this.ship.y, this.height) * 0.15, this.height);


        this.angle = this.ship.angle;
    }

    zoom(f = 1) {
        this.scale = this.scale * f;
    }

    attach(obj: Ship) {
        this.ship = obj ?? this.ship;
    }
}


export const world = new World({
    x: 0,
    y: 0,
    width: worldSize.width,
    height: worldSize.height,
    scale: 0.3,
})