
import { Server } from "socket.io";
import uWS from "uWebSockets.js";
import { createAdapter } from "@socket.io/redis-streams-adapter";

import { config } from "./index.ts";
import redis from "./redis.ts";
import { env } from "./env.ts";

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

    Websocket.io.on("connection", (socket) => {
      console.log("Player connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
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
}
