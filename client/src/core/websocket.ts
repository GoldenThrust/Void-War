import { io } from "socket.io-client";

export default class Websocket {
  public socket;
  constructor(url = "\\") {
    this.socket = io(url, {
      withCredentials: true,
    });
  }

  init() {
    // this.socket.on("init:ship", (ships) => {
    //   ShipManager.ships = [];
    //   ShipManager.ships.push(ship);
    //   for (const ship of ships) {
    //     ShipManager.ships.push(new OnlineShip(ship));
    //   }
    // });
    // this.socket.on("init:asteroid", (asteroids) => {
    //   Asteroid.asteroids = [];
    //   for (const asteroid of asteroids) {
    //     const newAst = new Asteroid();
    //     newAst.init(asteroid);
    //     Asteroid.asteroids.push(newAst);
    //   }
    // });
  }
}

export const websocket = new Websocket("http://localhost:3000/");
