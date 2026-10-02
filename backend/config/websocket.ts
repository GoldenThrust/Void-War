import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "./index.ts";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import redis from "./redis.ts";
import { initialize, snapshot, step } from "../core/main.ts";
import { FIXED_DT } from "../core/utils/constants.ts";

export default class Websocket {
  static io: Server;
  private static gameLoop?: NodeJS.Timeout;

  static run(app: HttpServer) {
    Websocket.io = new Server(app, {
      adapter: createAdapter(redis),
      cors: {
        origin: [config.env.CLIENT_URL],
        credentials: true,
      },
    });

    console.log("Websocket opened");
    initialize();
    Websocket.gameLoop ??= setInterval(() => {
      step();
      Websocket.io.emit("game:update", snapshot());
    }, FIXED_DT * 1000);

    Websocket.io.on("connection", (socket) => {
      console.log("Connected to websocket");
      const state = snapshot();

      socket.emit("game:init", state);
      socket.emit("init:ship", state.ships);
      socket.emit("init:asteroid", state.asteroids);
    });
  }
}
