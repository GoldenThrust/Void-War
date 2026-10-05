import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "./index.ts";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import redis from "./redis.ts";
import { initialize, initSnapShot, step, updateSnapShot } from "../core/main.ts";
import { FIXED_DT } from "../core/utils/constants.ts";
import ShipManager from "../core/ships/manager.ts";
import Ship from "../core/ships/ship.ts";
import WeaponManager from "../core/weapons/manager.ts";
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
    name?: string;
    type?: string;
    x: number;
    y: number;
    angle: number;
    speed: number;
    width?: number;
    height?: number;
    acceleration?: number;
    damage?: number;
    range?: number;
    fireRate?: number;
    energyCost?: number;
    penetration?: number;
    distanceTraveled?: number;
    active?: boolean;
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

      socket.emit("game:init", {
        ...initSnapShot(),
        playerId: ShipManager.ships.get(socket.id)?.id ?? socket.id,
      });
      socket.on("player:update", (data: PlayerUpdateData) => {
        let ship = ShipManager.ships.get(socket.id);

        if (!ship) {
          ship = new Ship({
            id: data.ship.id,
            x: data.ship.x,
            y: data.ship.y,
            angle: data.ship.angle,
            width: 50,
            height: 50,
            acceleration: 3500,
            life: 1000,
            friend: false,
            controllable: false,
          });
          ship.state = "player";
          ShipManager.ships.set(socket.id, ship);
          ShipManager.friendsAlive += 1;
        }

        ship.x = data.ship.x;
        ship.y = data.ship.y;
        ship.angle = data.ship.angle;
        ship.speed = data.ship.speed;

        const receivedWeaponIds = new Set(data.weapons.map(({ id }) => id));
        for (const [weaponId, weapon] of WeaponManager.weapons) {
          if (weapon.ship === ship && !receivedWeaponIds.has(weaponId)) {
            WeaponManager.weapons.delete(weaponId);
          }
        }

        for (const weaponData of data.weapons) {
          let weapon = WeaponManager.weapons.get(weaponData.id);
          if (!weapon) {
            weapon = WeaponManager.createFromSnapshot({
              id: weaponData.id,
              name: weaponData.name,
              type: weaponData.type,
              x: weaponData.x,
              y: weaponData.y,
              angle: weaponData.angle,
              // speed: weaponData.speed,
              width: weaponData.width,
              height: weaponData.height,
              acceleration: weaponData.acceleration,
              damage: weaponData.damage,
              range: weaponData.range,
              fireRate: weaponData.fireRate,
              energyCost: weaponData.energyCost,
              penetration: weaponData.penetration,
              // distanceTraveled: weaponData.distanceTraveled,
              ship: ship,
              controllable: false,
            });
            WeaponManager.weapons.set(weaponData.id, weapon);
          }
          weapon.x = weaponData.x;
          weapon.y = weaponData.y;
          weapon.angle = weaponData.angle;
          weapon.speed = weaponData.speed;
          if (weaponData.width !== undefined) weapon.width = weaponData.width;
          if (weaponData.height !== undefined) weapon.height = weaponData.height;
          if (weaponData.acceleration !== undefined) {
            weapon.acceleration = weaponData.acceleration;
          }
          if (weaponData.damage !== undefined) weapon.damage = weaponData.damage;
          if (weaponData.range !== undefined) weapon.range = weaponData.range;
          if (weaponData.fireRate !== undefined) weapon.fireRate = weaponData.fireRate;
          if (weaponData.energyCost !== undefined) {
            weapon.energyCost = weaponData.energyCost;
          }
          if (weaponData.penetration !== undefined) {
            weapon.penetration = weaponData.penetration;
          }
          if (weaponData.distanceTraveled !== undefined) {
            weapon.distanceTraveled = weaponData.distanceTraveled;
          }
          if (weaponData.active !== undefined) weapon.active = weaponData.active;
        }
      })

      socket.on("game:resync", () => {
        socket.emit("game:init", {
          ...initSnapShot(),
          playerId: ShipManager.ships.get(socket.id)?.id ?? socket.id,
        });
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from websocket", socket.id);

        const ship = ShipManager.ships.get(socket.id);
        if (ship) {
          for (const [weaponId, weapon] of WeaponManager.weapons) {
            if (weapon.ship === ship) WeaponManager.weapons.delete(weaponId);
          }
        }

        if (ShipManager.ships.delete(socket.id)) {
          ShipManager.friendsAlive = Math.max(0, ShipManager.friendsAlive - 1);
        }
      });
    });
  }
}
