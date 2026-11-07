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
import type Ship from "../core/player/ships/ship.ts";
import Asteroid from "../core/world/object/asteroid/asteroid.ts";
import WeaponManager from "../core/weapons/manager.ts";
import PerkManager from "../core/perks/manager.ts";

export default class Websocket {
  static io: Server;
  private static gameLoop?: NodeJS.Timeout;
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
        socket.broadcast.emit("player:left", socket.id);
        const ship = ShipManager.ships.get(socket.id);
        if (ship) ShipManager.destroy(ship);
      });

      socket.on("player:init", (data: Ship) => {
        const friend = ShipManager.ships.size % 2 === 0;
        ShipManager.ships.set(
          socket.id,
          new PlayerShip({
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
        ship.speed = data.speed;

        socket.broadcast.emit("players:joined", [
          {
            id: socket.id,
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
        ]);

        const { ships, asteroids, weapons, perks } = snapShots(ship);

        socket.emit(
          "players:joined",
          ships.filter(({ id }) => id !== socket.id),
        );

        socket.emit("asteroids:init", asteroids);

        socket.emit("weapons:init", weapons);

        socket.emit("perks:init", perks);
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
    if (Websocket.gameLoop) {
      clearInterval(Websocket.gameLoop);
      Websocket.gameLoop = undefined;
    }

    Websocket.io?.close();
  }

  static update() {
    if (Websocket.gameLoop) return;

    Websocket.gameLoop = setInterval(() => {
      const t = performance.now() / 1000;
      step(t);
    }, FIXED_DT * 1000);
  }
}

function snapShots(ship?: Ship) {
  const ships = Array.from(ShipManager.ships.entries()).map(([id, s]) => ({
    id: id,
    x: s.x,
    y: s.y,
    angle: s.angle,
    speed: s.speed,
    acceleration: s.acceleration,
    width: s.width,
    height: s.height,
    color: s.color,
    vertices: s.getVertices(),
    ...(ship && { friend: s.friend === ship.friend }),
  }));

  const asteroids = Array.from(Asteroid.asteroids.values()).map((a) => ({
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
  }));

  const weapons = Array.from(WeaponManager.weapons.values())
    .filter((w) => w.active)
    .map((w) => ({
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
    }));

  const perks = Array.from(PerkManager.perks.values()).map((p) => {
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
  });

  return {
    ships,
    asteroids,
    weapons,
    perks,
  };
}
