import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "./index.ts";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import redis from "./redis.ts";
import { initialize, initSnapShot, step, updateSnapShot } from "../core/main.ts";
import { FIXED_DT } from "../core/utils/constants.ts";
import ShipManager from "../core/ships/manager.ts";
import Ship from "../core/ships/ship.ts";
// const SNAPSHOT_INTERVAL_MS = 1000 / 30;

type PlayerUpdateData = {
  ship: {
    id: string;
    x: number;
    y: number;
    angle: number;
    speed: number;
  };
  weapons: Array<{
    id: string;
    x: number;
    y: number;
    angle: number;
    speed: number;
  }>;
};

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
      console.log("Connected to websocket", socket.id);

      socket.emit("game:init", { ...initSnapShot(), playerId: socket.id });
      socket.on("player:update", (data: PlayerUpdateData) => {
        let ship = ShipManager.ships.get(socket.id);

        if (!ship) {
          ship = new Ship({
            id: socket.id,
            x: data.ship.x,
            y: data.ship.y,
            angle: data.ship.angle,
            width: 50,
            height: 50,
            acceleration: 3500,
            life: 100,
            friend: true,
          });
          ship.state = "player";
          ShipManager.ships.set(socket.id, ship);
          ShipManager.friendsAlive += 1;
        }

        ship.x = data.ship.x;
        ship.y = data.ship.y;
        ship.angle = data.ship.angle;
        ship.speed = data.ship.speed;
      })

      socket.on("game:resync", () => {
        socket.emit("game:init", { ...initSnapShot(), playerId: socket.id });
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from websocket", socket.id);

        if (ShipManager.ships.delete(socket.id)) {
          ShipManager.friendsAlive = Math.max(0, ShipManager.friendsAlive - 1);
        }
      });
    });
  }
}
