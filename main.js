import WeaponManager from "./core/weapons/manager.js";

import { destroyedShips } from "./core/player/ships/ship.js";
import { world } from "./core/world/world.js";
import { stars } from "./core/world/object/Star.js";
import { canvas, ctx } from "./core/world/canvas.js";
import { minimap } from "./core/world/minimap.js";
import { asteroids } from "./core/world/object/asteroid/asteroid.js";
import { clamp } from "./core/utils/math.js";
import { explosions } from "./core/player/prop/explosion.js";


import PlayerShip, { ship } from "./core/player/ships/player.js";
import EnemyManager from "./core/player/ships/enemies/manager.js";

import { spatial } from "./core/world/spatialHash.js";
import Minature from "./core/weapons/minature.js";
import { assets, buildAssets } from "./core/assets/main.js";
import { loadModel, runAI } from "./core/ai/init.js"
import { FIXED_DT } from "./core/utils/constants.js";

async function init() {
    await loadModel();
    await buildAssets();

    console.log("Assets loaded", assets);
    await import("./core/world/manager.js");

    PlayerShip.spawn(world.x, world.y);
    EnemyManager.init();
    
    world.attach(ship);
    requestAnimationFrame(animate);
}

export let attachWorld = -1;
let lastTime = performance.now();
let timeAccumulator = 0;


async function animate(t) {
    const deltaTime = clamp((t - lastTime) / 1000, 0, 1);
    lastTime = t;

    timeAccumulator += deltaTime;
    // console.log("Loop started");

    while (timeAccumulator >= FIXED_DT) {
        // console.log("In loop");
        spatial.clear();
        spatial.insertAll([ship], EnemyManager.ships, asteroids)

        for (const weapon of WeaponManager.weapons) {
            if (weapon instanceof Minature) continue;
            spatial.insert(weapon);
        }

        world.update();

        WeaponManager.update(t, FIXED_DT)
        EnemyManager.update(t, FIXED_DT);
        ship.update(t, FIXED_DT);
        runAI(t, FIXED_DT);

        for (const asteroid of asteroids) {
            asteroid.update(FIXED_DT);
        }

        timeAccumulator -= FIXED_DT;
    }

    // console.log("Out loop");

    world.render();

    for (const star of stars) {
        star.render();
    }

    WeaponManager.render();

    ship.render();
    EnemyManager.render();

    for (const asteroid of asteroids) {
        asteroid.render();
    }

    for (const exp of explosions) {
        exp.render();
    }

    minimap.render();
    // spatial.renderSpatialDebug();

    // static canvas object
    ctx.resetTransform();
    ctx.font = "20px monospace"
    ctx.fillStyle = "white";
    ctx.fillText(`Ships Alive: ${EnemyManager.ships.length} - Destroyed: ${destroyedShips.length} Kill: ${ship.killScore} Weapon name: ${ship.weapon.name} heat: ${Math.ceil((ship.heat / ship.maxHeat) * 100)}`, 10, 20);


    if (ship.life > 0 && EnemyManager.ships.length > 0)
        requestAnimationFrame(animate);
    else {
        const text = ship.life <= 0 ? "Game Over 😭. Try again." : "You dominate the void 🥳.";

        ctx.font = '50px Arial';

        const { width } = ctx.measureText(text);
        ctx.fillText(text, (canvas.width - width) / 2, canvas.height / 2);
    }
}

// displayElem.addEventListener("click", async () => {
await init();
// })
