import { Server } from "socket.io";
import uWS from "uWebSockets.js";
import { createAdapter } from "@socket.io/redis-streams-adapter";

import { config } from "./index.ts";
import redis from "./redis.ts";
import { env } from "./env.ts";
import { init, step } from "../core/main.ts";
import { FIXED_DT } from "../core/utils/constants.ts";
import ShipManager from "../core/player/ships/manager.ts";
import PlayerShip from "../core/player/ships/player.ts";
import Ship from "../core/player/ships/ship.ts";
import Asteroid from "../core/world/object/asteroid/asteroid.ts";
import WeaponManager from "../core/weapons/manager.ts";
import PerkManager from "../core/perks/manager.ts";
import { world } from "../core/world/world.ts";

/** Snapshots per second sent to clients (simulation still runs at FIXED_DT). */
const PLAYERS_ROOM = "players";

/** Epoch-based, sub-millisecond clock. Clients estimate their offset against it. */
const serverNow = () => performance.timeOrigin + performance.now();

type MapValue<M> = M extends Map<any, infer V> ? V : never;
type WeaponT = MapValue<typeof WeaponManager.weapons>;
type PerkT = MapValue<typeof PerkManager.perks>;

/** Entities whose static data (vertices, size, colour...) every client already has. */
const announced = {
  asteroids: new Set<unknown>(),
  weapons: new Set<unknown>(),
  perks: new Set<unknown>(),
};

export default class Websocket {
  static io: Server;
  private static gameLoop?: NodeJS.Timeout;
  private static running = false;
  private static uwsApp: ReturnType<typeof uWS.App>;

  static async run() {
    if (Websocket.gameLoop) return;

    Websocket.uwsApp = uWS.App();

    Websocket.io = new Server({
      adapter: createAdapter(redis),
      cors: {
        origin: [config.env.CLIENT_URL],
        credentials: true,
      },
    });

    // Attach Socket.IO to uWebSockets.js
    Websocket.io.attachApp(Websocket.uwsApp);

    await init();
    Websocket.update();

    Websocket.io.on("connection", (socket) => {
      console.log("Player connected:", socket.id);

      socket.on("disconnect", () => {
        const ship = ShipManager.ships.get(socket.id);

        if (ship) {
          socket.broadcast.emit(
            "player:left",
            socket.id,
            shipsAliveCount(ship.friend),
          );
          ShipManager.destroy(ship);
        }
      });

      socket.on("player:init", (data: Ship) => {
        const friend = ShipManager.ships.size % 2 === 0;

        if (friend) {
          ShipManager.friendsAlive++;
        } else {
          ShipManager.enemiesAlive++;
        }

        ShipManager.ships.set(
          socket.id,
          new PlayerShip({
            id: socket.id,
            x: data.x,
            y: data.y,
            angle: data.angle,
            acceleration: data.acceleration,
            width: data.width,
            height: data.height,
            color: data.color,
            friend,
          }),
        );

        const ship = ShipManager.ships.get(socket.id);
        if (!ship) {
          console.error("Ship not found for socket:", socket.id);
          return;
        }
        if (typeof data.speed === "number" && Number.isFinite(data.speed)) {
          console.log("Updating speed", data.speed);
          ship.speed = data.speed;
        }

        // Only joined players receive the per-tick stream.
        socket.join(PLAYERS_ROOM);

        const t = serverNow();

        socket.broadcast.emit(
          "player:joined",
          {
            id: socket.id,
            name: ship.name,
            x: ship.x,
            y: ship.y,
            angle: ship.angle,
            speed: ship.speed,
            acceleration: ship.acceleration,
            width: ship.width,
            height: ship.height,
            color: ship.color,
            vertices: ship.vertices,
            friend,
          },
          t,
        );

        const { ships, asteroids, weapons, perks } = snapShots(ship);

        socket.emit("world:init", {
          width: world.width,
          height: world.height,
        });
        socket.emit("players:init", ships, {
          id: socket.id,
          t,
          ...shipsAliveCount(friend),
        });

        socket.emit("asteroids:init", asteroids, t);
        socket.emit("weapons:init", weapons, t);
        socket.emit("perks:init", perks, t);
      });

      socket.on(
        "player:changeWeapon",
        ({ weaponName }: { weaponName?: string }) => {
          const ship = ShipManager.ships.get(socket.id);
          if (!ship) {
            console.warn(
              `Cannot change weapon for unknown player ${socket.id}`,
            );
            return;
          }

          const weapon = WeaponManager.weaponsByName[weaponName ?? ""];
          if (!weapon) {
            console.warn(`Unknown weapon requested: ${weaponName}`);
            return;
          }

          ship.weapon = weapon;
        },
      );

      socket.on(
        "player:turn",
        ({ direction }: { direction?: "left" | "right" }) => {
          const ship = ShipManager.ships.get(socket.id);
          if (!ship) return;
          ship.steer(direction === "left" ? 1 : -1);
        },
      );

      socket.on(
        "player:thrust",
        ({ direction }: { direction?: "forward" | "backward" }) => {
          const ship = ShipManager.ships.get(socket.id);
          if (!ship) return;
          ship.accelerate(direction === "forward" ? 1 : -1);
        },
      );

      socket.on("player:fire", () => {
        const ship = ShipManager.ships.get(socket.id);
        if (!ship) return;
        ship.fire();
      });
    });

    Websocket.uwsApp.listen(env.HOST, Number(env.WS_PORT), (token) => {
      if (!token) {
        console.error("Failed to start uWebSockets server");
        return;
      }

      console.log(`WebSocket server listening on ${env.WS_PORT}`);
    });
  }

  static stop() {
    Websocket.running = false;
    if (Websocket.gameLoop) {
      clearTimeout(Websocket.gameLoop);
      Websocket.gameLoop = undefined;
    }

    Websocket.io?.close();
  }

  static update() {
    if (Websocket.gameLoop) return;
    Websocket.running = true;

    const stepMs = FIXED_DT * 1000;
    let nextTick = performance.now() + stepMs;

    // Drift-corrected loop: each tick is scheduled against an absolute target,
    // so timer lateness doesn't accumulate into uneven step/snapshot spacing.
    const tick = () => {
      if (!Websocket.running) return;

      const now = performance.now();
      step(now / 1000);

      broadcast();

      nextTick += stepMs;
      if (nextTick < now - stepMs * 4) nextTick = now + stepMs; // fell far behind: resync
      Websocket.gameLoop = setTimeout(
        tick,
        Math.max(0, nextTick - performance.now()),
      );
    };

    Websocket.gameLoop = setTimeout(tick, stepMs);
  }
}

/* ------------------------------ broadcasting ----------------------------- */

function broadcast() {
  const { frame, spawn } = buildFrame();

  // `.local` skips the Redis adapter: the simulation lives in this process,
  // so fanning 30 snapshots/s through Redis streams only adds latency and jitter.
  const room = Websocket.io.local.to(PLAYERS_ROOM);

  // Reliable and ordered before the frame that references the new entities.
  if (spawn) room.emit("entities:spawn", spawn);

  // Volatile: if a client's socket is backed up, drop the stale frame instead of queueing it.
  // console.log("Broadcasting update", serverNow());
  // console.log("Date Time", new Date(serverNow()).getMilliseconds());

  console.log(frame.ships[0]?.speed)

  room.volatile.emit("game:update", frame);
}

function diffAnnounce<T extends { id: unknown }>(
  known: Set<unknown>,
  items: T[],
): T[] {
  const fresh: T[] = [];
  const alive = new Set<unknown>();

  for (const item of items) {
    alive.add(item.id);
    if (!known.has(item.id)) {
      known.add(item.id);
      fresh.push(item);
    }
  }
  for (const id of known) {
    if (!alive.has(id)) known.delete(id);
  }

  return fresh;
}

function buildFrame() {
  const t = serverNow();

  const asteroidList = Array.from(Asteroid.asteroids.values());
  const weaponList = activeWeapons();
  const perkList = Array.from(PerkManager.perks.values());

  const spawn = {
    t,
    asteroids: diffAnnounce(announced.asteroids, asteroidList).map(
      fullAsteroid,
    ),
    weapons: diffAnnounce(announced.weapons, weaponList).map(fullWeapon),
    perks: diffAnnounce(announced.perks, perkList).map(fullPerk),
  };
  const hasSpawn =
    spawn.asteroids.length > 0 ||
    spawn.weapons.length > 0 ||
    spawn.perks.length > 0;

  const frame = {
    t,
    ships: Array.from(ShipManager.ships.entries()).map(([id, s]) =>
      dynShip(id, s),
    ),
    asteroids: asteroidList.map(dynAsteroid),
    weapons: weaponList.map(dynWeapon),
    perks: perkList.map(dynPerk),
  };

  return { frame, spawn: hasSpawn ? spawn : null };
}

/* ---------------------- full state (join / first sight) ------------------- */

function fullShip(id: string, s: Ship, viewer?: Ship) {
  return {
    id,
    x: s.x,
    y: s.y,
    name: s.name,
    angle: s.angle,
    speed: s.speed,
    acceleration: s.acceleration,
    width: s.width,
    height: s.height,
    color: s.color,
    vertices: s.vertices,
    life: s.life,
    heat: s.heat,
    ...(viewer && { friend: s.friend === viewer.friend }),
  };
}

function fullAsteroid(a: Asteroid) {
  return {
    id: a.id,
    x: a.x,
    y: a.y,
    angle: a.angle,
    vx: a.vx,
    vy: a.vy,
    rotationSpeed: a.rotationSpeed,
    width: a.width,
    height: a.height,
    vertices: a.vertices,
  };
}

function fullWeapon(w: WeaponT) {
  return {
    id: w.id,
    name: w.name,
    x: w.x,
    y: w.y,
    type: w.type,
    width: w.width,
    height: w.height,
    angle: w.angle,
    speed: w.speed,
    acceleration: w.acceleration,
    shipId: w.ship.id,
    color: w.color,
    damage: w.damage,
    range: w.range,
    fireRate: w.fireRate,
    energyCost: w.energyCost,
    vertices: w.vertices,
    penetration: w.penetration,
    distanceTraveled: w.distanceTraveled,
  };
}

function fullPerk(p: PerkT) {
  const ship = p.getShip();

  return {
    id: p.id,
    x: p.x,
    y: p.y,
    name: p.name,
    angle: p.angle,
    width: p.width,
    height: p.height,
    color: p.color,
    vertices: p.vertices,
    duration: p.duration,
    startTime: p.startTime,
    shipId: ship ? ship.id : undefined,
  };
}

/* ------------------------- dynamic state (every frame) -------------------- */

function dynShip(id: string, s: Ship) {
  return {
    id,
    x: s.x,
    y: s.y,
    angle: s.angle,
    speed: s.speed,
    acceleration: s.acceleration,
    life: s.life,
    heat: s.heat,
  };
}

function dynAsteroid(a: Asteroid) {
  return {
    id: a.id,
    x: a.x,
    y: a.y,
    angle: a.angle,
    vx: a.vx,
    vy: a.vy,
    rotationSpeed: a.rotationSpeed,
  };
}

function dynWeapon(w: WeaponT) {
  return {
    id: w.id,
    x: w.x,
    y: w.y,
    angle: w.angle,
    speed: w.speed,
    acceleration: w.acceleration,
    distanceTraveled: w.distanceTraveled,
  };
}

function dynPerk(p: PerkT) {
  const ship = p.getShip();

  return {
    id: p.id,
    x: p.x,
    y: p.y,
    angle: p.angle,
    startTime: p.startTime,
    shipId: ship ? ship.id : undefined,
  };
}

/* --------------------------------- helpers -------------------------------- */

function activeWeapons() {
  return Array.from(WeaponManager.weapons.values()).filter((w) => w.active);
}

/** Full world state, used for the join-time init events. */
function snapShots(ship?: Ship) {
  return {
    ships: Array.from(ShipManager.ships.entries()).map(([id, s]) =>
      fullShip(id, s, ship),
    ),
    asteroids: Array.from(Asteroid.asteroids.values()).map(fullAsteroid),
    weapons: activeWeapons().map(fullWeapon),
    perks: Array.from(PerkManager.perks.values()).map(fullPerk),
  };
}

function shipsAliveCount(friend: boolean) {
  return {
    friendsAlive: friend ? ShipManager.friendsAlive : ShipManager.enemiesAlive,
    enemiesAlive: friend ? ShipManager.enemiesAlive : ShipManager.friendsAlive,
    guerrilla: friend,
  };
}
