import { randomNum } from "../../utils/random.ts";
import { ctx } from "../../world/canvas.ts";
import { drawWrapped, wrap } from "../../world/utils.ts";
import { world } from "../../world/world.ts";

export default class Explosion {
    private static readonly pool: Explosion[] = [];
    private static readonly maxParticles = 84;
    private static readonly maxPoolSize = 64;
    private particles: { x: number; y: number; vx: number; vy: number; radius: number; life: number; }[] = [];
    private particleCount = 0;
    private life = 0;
    private maxLife = 0;
    private color = "#ff6938";
    private impact = false;
    private x = 0;
    private y = 0;
    private radius = 0;

    private constructor() {
        for (let index = 0; index < Explosion.maxParticles; index++) {
            this.particles.push({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                radius: 0,
                life: 0,
            });
        }
    }

    static acquire(
        x: number,
        y: number,
        intensity = 500,
        color = "#ff6938",
        impact = false,
    ) {
        const explosion = this.pool.pop() ?? new Explosion();
        explosion.reset(x, y, intensity, color, impact);
        explosions.push(explosion);
        return explosion;
    }

    private reset(
        x: number,
        y: number,
        intensity: number,
        color: string,
        impact: boolean,
    ) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.impact = impact;
        this.maxLife = impact ? 18 : 50;
        this.life = this.maxLife;
        this.particleCount = Math.min(
            Math.ceil(intensity / 6),
            Explosion.maxParticles,
        );
        for (let index = 0; index < this.particleCount; index++) {
            const particle = this.particles[index];
            particle.x = x;
            particle.y = y;
            particle.vx = randomNum(-intensity, intensity) / 10;
            particle.vy = randomNum(-intensity, intensity) / 10;
            particle.radius = randomNum(0.8, impact ? 2.8 : 4);
            particle.life = randomNum(0.65, 1);
        }
    }

    render() {
        const progress = 1 - this.life / this.maxLife;
        this.radius = (this.impact ? 34 : 115) * Math.sin(Math.min(progress, 1) * Math.PI);

        drawWrapped({
            x: this.x,
            y: this.y,
            margin: { width: 140, height: 140 },
            fn: () => {
                ctx.save();
                ctx.globalCompositeOperation = "lighter";

                const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, this.impact ? 32 : 90);
                glow.addColorStop(0, `rgba(255, 245, 190, ${0.8 * (1 - progress)})`);
                glow.addColorStop(0.2, `${this.color}c0`);
                glow.addColorStop(1, `${this.color}00`);
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(0, 0, this.impact ? 32 : 90, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = `${this.color}${Math.max(0, Math.round(220 * (1 - progress))).toString(16).padStart(2, "0")}`;
                ctx.lineWidth = this.impact ? 2 : 4;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            },
        });

        for (let index = 0; index < this.particleCount; index++) {
            const p = this.particles[index];
            drawWrapped({
                fn: () => {
                    ctx.save();
                    ctx.globalCompositeOperation = "lighter";
                    ctx.fillStyle = p.life > 0.3 ? "#fff3c4" : this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }, x: p.x, y: p.y
            })

            p.x = wrap(p.x + p.vx, world.width);
            p.y = wrap(p.y + p.vy, world.height)
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= 1 / this.maxLife;
        }

        if (!(--this.life)) this.destroy();
    }

    destroy() {
        const index = explosions.indexOf(this);
        if (index > -1) {
            explosions.splice(index, 1);
            this.life = 0;
            this.particleCount = 0;
            if (Explosion.pool.length < Explosion.maxPoolSize) {
                Explosion.pool.push(this);
            }
        }
    }
}

export const explosions: Explosion[] = [];