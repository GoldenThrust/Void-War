import { world } from "../world/world.ts";
import { toroidalDelta } from "../world/utils.ts";
import AI from "../player/ships/enemies/AI.ts";
import EnemyManager from "../player/ships/enemies/manager.ts";
import PlayerShip from "../player/ships/player.ts";

type ActionMessage = {
    type: "actions";
    actions: Float32Array;
};

let worker: Worker | undefined;
let predicting = false;
let pendingShips: AI[] = [];
let pendingActions: Float32Array | undefined;

export function loadModel() {
    worker ??= new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<ActionMessage | { type: "ready" }>) => {
        if (event.data.type === "actions") {
            pendingActions = event.data.actions;
            predicting = false;
        }
    };
    worker.postMessage({ type: "load", url: "/models/nav_policy.onnx" });
}

export function runAI() {
    if (!worker || predicting) return;

    const aiShips = EnemyManager.ships.filter((enemy): enemy is AI => enemy instanceof AI);
    if (aiShips.length === 0) return;

    const selfData = new Float32Array(aiShips.length * 4);
    const enemyData = new Float32Array(aiShips.length * 4);

    aiShips.forEach((enemy, index) => {
        const offset = index * 4;
        selfData[offset] = enemy.x / world.width;
        selfData[offset + 1] = enemy.y / world.height;
        selfData[offset + 2] = enemy.angle / Math.PI - 1;
        selfData[offset + 3] = enemy.speed / 50000;
        enemyData[offset] = toroidalDelta(enemy.x, PlayerShip.ship.x, world.width) / (world.width / 2);
        enemyData[offset + 1] = toroidalDelta(enemy.y, PlayerShip.ship.y, world.height) / (world.height / 2);
        enemyData[offset + 2] = PlayerShip.ship.angle / Math.PI - 1;
        enemyData[offset + 3] = PlayerShip.ship.speed / 50000;
    });

    pendingShips = aiShips;
    predicting = true;
    worker.postMessage(
        { type: "predict", selfData, enemyData, count: aiShips.length },
        [selfData.buffer, enemyData.buffer],
    );
}

export function applyAIResults() {
    if (!pendingActions) return;

    const actions = pendingActions;
    pendingActions = undefined;
    pendingShips.forEach((enemy, index) => {
        if (EnemyManager.ships.includes(enemy)) {
            enemy.setAIAction(actions[index * 2], actions[index * 2 + 1]);
        }
    });
    pendingShips = [];
}
