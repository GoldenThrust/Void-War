import { Server } from "socket.io";
import uWS from "uWebSockets.js";
import { createAdapter } from "@socket.io/redis-streams-adapter";

import { config } from "./index.ts";
import redis from "./redis.ts";
import { env } from "./env.ts";
import { init, step } from "../core/main.ts";
import { FIXED_DT } from "../core/utils/constants.ts";

export default class Websocket {
  static io: Server;
  private static gameLoop?: NodeJS.Timeout;
  private static uwsApp: ReturnType<typeof uWS.App>;

  static run() {
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

    init();

    Websocket.io.on("connection", (socket) => {
      console.log("Player connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
      });

      socket.on("init:player", (data) => {
        console.log("Player initialized:", socket.id, data);
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
    Websocket.gameLoop = setInterval(() => {
      const t = performance.now() / 1000;
      const elapsedSeconds = FIXED_DT;
      step(t, elapsedSeconds);
      Websocket.update();
    }, FIXED_DT * 1000);
  }
}
