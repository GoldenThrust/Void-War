import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "./index.ts";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import redis from "./redis.ts";
import { initialize, initSnapShot, step, updateSnapShot } from "../core/main.ts";
import { FIXED_DT } from "../core/utils/constants.ts";
// const SNAPSHOT_INTERVAL_MS = 1000 / 30;

export default class Websocket {
  static io: Server;
  private static gameLoop?: NodeJS.Timeout;
  // private static snapshotAccumulator = 0;

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
      // Websocket.snapshotAccumulator += FIXED_DT * 1000;
      // if (Websocket.snapshotAccumulator < SNAPSHOT_INTERVAL_MS) return;

      // Websocket.snapshotAccumulator -= SNAPSHOT_INTERVAL_MS;
      Websocket.io.emit("game:update", updateSnapShot());
    }, FIXED_DT * 1000);

    Websocket.io.on("connection", (socket) => {
      console.log("Connected to websocket");

      socket.emit("game:init", initSnapShot());
    });
  }
}
