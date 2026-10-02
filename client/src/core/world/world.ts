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
        ctx.save();
        ctx.resetTransform();
        const centerX = canvas.width * 0.58;
        const centerY = canvas.height * 0.42;
        const nebula = ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            Math.max(canvas.width, canvas.height) * 0.72,
        );
        nebula.addColorStop(0, "rgba(32, 44, 91, 0.32)");
        nebula.addColorStop(0.32, "rgba(14, 31, 58, 0.2)");
        nebula.addColorStop(1, "rgba(1, 5, 11, 0)");

        ctx.fillStyle = "#02060d";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const horizon = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        horizon.addColorStop(0, "rgba(92, 46, 150, 0.08)");
        horizon.addColorStop(0.48, "rgba(0, 0, 0, 0)");
        horizon.addColorStop(1, "rgba(18, 96, 116, 0.08)");
        ctx.fillStyle = horizon;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

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