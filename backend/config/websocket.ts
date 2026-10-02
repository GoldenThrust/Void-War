import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import ShipManager from "../core/ships/manager.ts";
import { config } from "./index.ts";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import redis from "./redis.ts";
import { initialize } from "../core/main.ts";
import Asteroid from "../core/world/object/asteroid/asteroid.ts";

export default class Websocket {
  static io: Server;
  static socket: Socket;

  static run(app: HttpServer) {
    Websocket.io = new Server(app, {
      adapter: createAdapter(redis),
      cors: {
        origin: [config.env.CLIENT_URL],
        credentials: true,
      },
    });

    console.log("Websocket opened");

    Websocket.io.on("connection", async (socket) => {
      Websocket.socket = socket;
      console.log("Connected to websocket");
      await initialize();

      socket.emit(
        "init:ship",
        ShipManager.ships.values().map((ship) => ({
          name: ship.name,
          x: ship.x,
          y: ship.y,
          angle: ship.angle,
          friend: ship.friend,
          vertices: ship.vertices,
          color: ship.color,
        })),
      );

      socket.emit(
        "init:asteroid",
        Asteroid.asteroids.values().map((asteroid) => ({
          x: asteroid.x,
          y: asteroid.y,
          angle: asteroid.angle,
          vertices: asteroid.vertices,
          width: asteroid.width,
          height: asteroid.height,
          speed: asteroid.speed,
          rotationSpeed: asteroid.rotationSpeed,
        })),
      );
    });
  }
}
