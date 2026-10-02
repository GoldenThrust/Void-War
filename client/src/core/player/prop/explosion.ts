import { assets } from "../../assets/main.ts";
import { randomNum } from "../../utils/random.ts";
import { ctx } from "../../world/canvas.ts";
import { drawWrapped, wrap } from "../../world/utils.ts";
import { world } from "../../world/world.ts";

export default class Explosion {
    private particles: { x: number; y: number; vx: number; vy: number; radius: any; }[];
    private life: number;
    private img: HTMLImageElement;

    constructor(x: number, y: number, intensity = 100) {
        this.particles = Array.from(new Array(Math.ceil(intensity/10))).map(() => ({ x, y, vx: randomNum(-intensity, intensity) / 10, vy: randomNum(-intensity, intensity) / 10, radius: randomNum(0.1, 2) }));
        this.life = 50;
        this.img = assets?.images?.explosionflame
    }

    render() {
        ctx.fillStyle = "red";
        for (const p of this.particles) {
            drawWrapped({
                fn: () => {
                    if (this.img) {
                        ctx.drawImage(this.img, -5, -5, 10, 10);
                    }
                    else {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }, x: p.x, y: p.y
            })

            p.x = wrap(p.x + p.vx, world.width);
            p.y = wrap(p.y + p.vy, world.height)
        }

        if (!(--this.life)) this.destroy();
    }

    destroy() {
        const index = explosions.indexOf(this);
        if (index > -1) {
            explosions.splice(index, 1);
        }
    }
}

export const explosions: Explosion[] = [];