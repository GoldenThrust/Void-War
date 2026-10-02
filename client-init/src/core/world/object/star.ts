
import { randomNum } from "../../utils/random.ts";
import { world } from "../world.ts";
import { ctx } from "../canvas.ts";
import { drawWrapped, wrap } from "../utils.ts";
import { sizeOf } from "../../utils/constants.ts";

type StarC = {
    x: number;
    y: number;
    radius: number;
    bright: number;
    twinkle: number;
    speed: number;
}
class Star {
    public x;
    public y;
    public radius;
    public bright;
    public twinkle;
    public speed;
    public path2D;

    constructor({
        x, y, radius, bright, twinkle, speed
    }: StarC) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.bright = bright;
        this.twinkle = twinkle;
        this.speed = speed;
        this.path2D = new Path2D();
    }

    render() {
        drawWrapped({
            fn: () => {
                this.twinkle = wrap(this.twinkle + this.speed, Math.PI * 2);
                const alpha = this.bright * (Math.sin(this.twinkle));
        
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,215,255, ${alpha})`;
                ctx.fill();
            }, x: this.x, y: this.y
        })
    }
}

export const stars: Star[] = [];

for (let i = 0; i < sizeOf.star; i++) {
    stars.push(new Star({
        x: randomNum(0, world.width),
        y: randomNum(0, world.height),
        radius: randomNum(0.2, 2),
        bright: randomNum(0.2, 0.7),
        twinkle: randomNum(-Math.PI, Math.PI),
        speed: randomNum(0.002, 0.006)
    }))
}