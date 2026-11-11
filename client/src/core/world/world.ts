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

        // const grid = Math.max(48, canvas.width / 14);
        // ctx.strokeStyle = "rgba(91, 157, 202, 0.045)";
        // ctx.lineWidth = 1;
        // ctx.beginPath();
        // for (let x = 0; x < canvas.width; x += grid) {
        //     ctx.moveTo(x, 0);
        //     ctx.lineTo(x, canvas.height);
        // }
        // for (let y = 0; y < canvas.height; y += grid) {
        //     ctx.moveTo(0, y);
        //     ctx.lineTo(canvas.width, y);
        // }
        // ctx.stroke();

        // const vignette = ctx.createRadialGradient(
        //     canvas.width / 2,
        //     canvas.height / 2,
        //     Math.min(canvas.width, canvas.height) * 0.18,
        //     canvas.width / 2,
        //     canvas.height / 2,
        //     Math.max(canvas.width, canvas.height) * 0.72,
        // );
        // vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
        // vignette.addColorStop(1, "rgba(0, 0, 0, 0.48)");
        // ctx.fillStyle = vignette;
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        ctx.translate((canvas.width - this.width) / 2, (canvas.height - this.height) / 2);
    }

    update(dt = 1) {
        if (!this.ship) return;
        this.x = wrap(this.x + toroidalDelta(this.x, this.ship.x, this.width) * 0.15 * dt, this.width);
        this.y = wrap(this.y + toroidalDelta(this.y, this.ship.y, this.height) * 0.15 * dt, this.height);
        

        console.log("World update", toroidalDelta(this.x, this.ship.x, this.width), toroidalDelta(this.y, this.ship.y, this.height)
    );
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