import { world } from "../../world/world.ts";
import { ctx } from "../../world/canvas.ts";
import { toroidalDelta } from "../../world/utils.ts";

export default class Trail {
    public length;
    private color;
    private trails: {
        x: number;
        y: number;
        speed: number;
    }[];
    constructor(length: number, color = "blue") {
        this.length = length;
        this.color = color;
        this.trails = [];
    }

    update(x: number, y: number, speed: number) {
        if (this.trails.length > this.length) {
            this.trails.shift();
        }

        this.trails.push({ x, y, speed });
    }

    render() {
        if (this.trails.length < 2) return;
        for (let i = 1; i < this.trails.length; i++) {
            const a = this.trails[i - 1], b = this.trails[i];
            const avgSpeed = (a.speed + b.speed) / 2;

            const adx = toroidalDelta(world.x, a.x, world.width);
            const ady = toroidalDelta(world.y, a.y, world.height);
            const bdx = toroidalDelta(world.x, b.x, world.width);
            const bdy = toroidalDelta(world.y, b.y, world.height);

            const t = i / this.trails.length;

            if (Math.abs(adx - bdx) > avgSpeed || Math.abs(ady - bdy) > avgSpeed) continue;
            ctx.beginPath();
            ctx.moveTo(adx, ady);
            ctx.lineTo(bdx, bdy);
            const gradient = ctx.createLinearGradient(adx, ady, bdx, bdy);
            gradient.addColorStop(0, "rgba(255,255,255,0)");
            gradient.addColorStop(1, this.color);
            ctx.strokeStyle = gradient;

            ctx.globalAlpha = t * 0.1;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = t * 5;
            ctx.lineWidth = t * 3;
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
    }
}