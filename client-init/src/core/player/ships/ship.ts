import { ctx } from "../../world/canvas.ts";
import { createVerticesPath, drawVerticesPath, tranformVertices } from "../../utils/vertices.ts";
import { drawWrapped, worldToScreen, wrap } from "../../world/utils.ts";
import { world } from "../../world/world.ts";
import { randomNum } from "../../utils/random.ts";
import Trail from "../prop/trail.ts";
import { clamp } from "../../utils/math.ts";
import { keys } from "../../events/keys.ts";
import { FIXED_DT } from "../../utils/constants.ts";

import WeaponManager from "../../weapons/manager.ts";
import { shapes } from "./shapes.ts";
import PulseCanon from "../../weapons/pulse-canon.ts";
import type EnemyShip from "./enemies/enemy.ts";
// import EngineSound from "../../assets/audio/engine.ts";
// import AudioManager from "../../assets/audio/manager.ts";

export default class 
Ship {
    public name: string;
    public x: number;
    public y: number;
    public speed: number;
    public acceleration: number;
    public width: number;
    public height: number;
    public angle: number;
    public color: string;
    protected turnRate: number;
    protected img;
    protected flameImg;
    protected dampSpeed;
    // protected dt;
    protected controllable;
    protected lastTime;
    public weapon;
    public killScore;
    protected vertices;
    protected path2D;
    public life;
    protected fullLife;
    protected cooldown;
    protected heat;
    protected maxHeat;
    protected weaponState;
    protected maxSpeed;
    protected trail;
    protected speedFactor;
    public state;
    // private engineSound;

    constructor({ x, y, width, height, angle, img, flameImg, weapon = PulseCanon, acceleration = 3500, life = 100, vertices = shapes[0], color = "red", name = "Player", controllable = false, maxWeaponHeat = 10000 }: ShipC) {
        this.x = x;
        this.y = y;
        this.speed = 0;
        this.acceleration = acceleration/2;
        this.width = width;
        this.height = height;
        this.angle = angle;
        this.color = color;
        this.turnRate = 2;

        this.name = name;

        this.img = img;
        this.flameImg = flameImg;

        this.dampSpeed = 0.75 ** (FIXED_DT);
        // this.dt = FIXED_DT;


        this.controllable = controllable;

        this.lastTime = 0;

        this.weapon = weapon;
        this.killScore = 0;

        this.vertices = vertices;

        this.path2D = createVerticesPath(tranformVertices(this.vertices, 0, 0, this.width, this.height, 0));

        this.life = life;
        this.fullLife = life;

        this.cooldown = 0;
        this.heat = 0;
        this.maxHeat = maxWeaponHeat;
        this.weaponState = "cool";
        this.maxSpeed = (this.dampSpeed * acceleration * FIXED_DT) / (1 - this.dampSpeed);
        // console.log(this.maxSpeed, this.acceleration, this.dampSpeed, FIXED_DT)
        this.trail = new Trail(Math.max(Math.ceil(this.maxSpeed / this.acceleration) * 5, 1), "white");
        // console.log("Trail created", this.trail.length)

        this.speedFactor = Math.sqrt(this.speed / (this.maxSpeed || 1));
        this.state = "idle";
        // this.engineSound = new EngineSound(this);
        // AudioManager.set = this.engineSound;
    }

    render() {
        ctx.translate(world.width / 2, world.height / 2);
        this.trail.render();
        ctx.translate(-world.width / 2, -world.height / 2);

        drawWrapped({
            fn: () => {
                // draw lifej
                const scaleLife = this.life / this.fullLife * this.width;

                ctx.fillStyle = "springgreen";
                ctx.strokeStyle = "springgreen";

                ctx.beginPath();
                ctx.roundRect(-this.width / 2, -this.height, this.width, 3, 10);
                ctx.stroke();
                ctx.beginPath();
                ctx.roundRect(-this.width / 2, -this.height, scaleLife, 3, 10);
                ctx.fill();
                ctx.rotate(-this.angle);

                if (this.img && this.flameImg) {
                    if (this.speed > 50) {
                        ctx.globalAlpha = clamp(this.speed / 200, 0, 1);
                        ctx.drawImage(this.flameImg, -this.width / 2, 0, this.width, this.height);
                        ctx.globalAlpha = 1;
                    }
                    ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
                } else {
                    drawVerticesPath(this.path2D, this.color);
                }
            }, x: this.x, y: this.y, margin: {
                width: 200, height: 200
            }
        })
    }

    update(t: number, dt: number, thrust = 0, turn = 0) {
        let steering = turn;
        let thrusting = this.state === "AI" ? thrust : 1;
        this.speedFactor = Math.sqrt(this.speed / this.maxSpeed);


        if (this.controllable) {
            if (keys["ArrowLeft"]) {
                // this.angle = wrap(this.angle + 0.01, Math.PI * 2);
                steering = 1;
            }

            if (keys["ArrowRight"]) {
                // this.angle = wrap(this.angle - 0.01, Math.PI * 2);
                steering = -1;
            }



            if (keys["ArrowUp"]) {
                this.speed += this.acceleration * dt;
            }

            if (keys["ArrowDown"]) {
                this.speed -= this.acceleration * dt;
                this.speed = Math.max(this.speed, 0);
            }

            if (keys[" "] || keys["Enter"] || keys["Space"]) {
                this.fire();
            }
        } else if (this.state === "idle") {
            this.randomMotion(t, dt, this.name === "Player");
        } else if (this.state === "AI") {
            this.speed += thrusting * this.acceleration * dt;
            this.speed = Math.max(this.speed, 0);
        }

        this.angle = wrap(this.angle + (steering * this.turnRate * this.speedFactor * FIXED_DT), Math.PI * 2);

        this.speed = Math.max(this.speed * this.dampSpeed, 0);

        if (this.state == "AI")
            console.log("Ship update", this.name, "Thrust:", thrusting, "Turn:", steering, "Controllable:", this.controllable, "State:", this.state)


        // updateWrapped(() => {
        this.x = wrap(this.x - Math.sin(this.angle) * (this.speed * dt), world.width);
        this.y = wrap(this.y - Math.cos(this.angle) * (this.speed * dt), world.height);

        this.trail.update(this.x, this.y, this.speed);

        // weapon update
        if (this.cooldown >= 0) {
            this.cooldown -= 1;
        }

        this.heat = clamp(this.heat - (this.maxHeat * 0.001), 0, this.maxHeat * 5);

        if (this.weaponState === "cool" && this.heat >= this.maxHeat) {
            this.weaponState = "hot";
        } else if (this.weaponState === "hot" && this.heat <= 0) {
            this.weaponState = "cool";
        }

        // this.engineSound.update(x, y);
    }

    randomMotion(t: number, dt: number, fire = true) {
        this.speed = this.speed + (this.acceleration * dt);

        if (t - this.lastTime > randomNum(0, 10000) || !this.lastTime) {
            this.angle = wrap(this.angle + (randomNum(-this.turnRate, this.turnRate) * this.speedFactor * FIXED_DT), Math.PI * 2);
            this.lastTime = t;
        } else if (t - this.lastTime > randomNum(0, 60000) || fire) {
            this.fire();
        }

        // if (t - this.lastTime > randomNum(0, 20000)) {
        //     weaponManager.nextWeapon();
        // }
    }

    canFire() {
        return (this.cooldown <= 0 && this.heat < this.maxHeat && this.weaponState === "cool")
    }


    fire() {
        if (!this.canFire()) return;

        const prop = {
            x: this.x - Math.sin(this.angle) * this.width / 2,
            y: this.y - Math.cos(this.angle) * this.height / 2,
            angle: this.angle,
            speed: this.speed,
            ship: this,
            color: this.name === "Player" ? "#33cfff" : "red"
        }

        WeaponManager.fire(this.weapon, prop)
    }


    setCoolDown(val: number) {
        this.cooldown = val;
    }

    increaseHeat(val: number) {
        this.heat += val;
    }

    setMaxHeat() {
        this.weaponState = "hot";
    }


    destroy() {
        console.log("Game Over");
        // this.engineSound.clean();
    }

    getVertices() {
        const world = worldToScreen(this.x, this.y);
        const vertices = tranformVertices(this.vertices, world.x, world.y, this.width, this.height, this.angle);

        return vertices;
    }
}


export const destroyedShips: EnemyShip[] = []
