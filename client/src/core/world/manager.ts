import { world } from "./world.ts";
import "../player/ships/manager.ts";
// import ShipManager from "../player/ships/manager.ts";
import { keybinds } from "../events/keybind.ts";
import { ship } from "../player/ships/player.ts";
import { minimap } from "./minimap.ts";

class WorldManager {
  public attachedId: number;

  constructor() {
    this.attachedId = -1;
    this.#addKeybinds();
  }

  #addKeybinds() {
    // keybinds["n"] = () => {
    //   this.attachNext();
    // };
    // keybinds["p"] = () => {
    //   this.attachPrevious();
    // };
    // keybinds["o"] = () => {
    //   this.attachMainShip();
    // };
    // keybinds["r"] = () => {
    //   this.attachRandom();
    // };

    keybinds["="] = () => {
     world.zoom(1.1);
    };
    keybinds["-"] = () => {
      world.zoom(0.9);
    };
    keybinds["+"] = () => {
     minimap.zoom(1.1);
    };
    keybinds["_"] = () => {
      minimap.zoom(0.9);
    };

  }

  findAttachedShip() {
    // if (this.attachedId === -1) {
      return ship;
    // } else {
    //   return ShipManager.ships[this.attachedId];
    // }
  }

  // attachRandom() {
  //   this.attachedId = Math.floor(Math.random() * ShipManager.ships.length);
  //   world.attach(ShipManager.ships[this.attachedId]);
  // }

  // attachNext() {
  //   this.attachedId = (this.attachedId + 1) % ShipManager.ships.length;
  //   world.attach(ShipManager.ships[this.attachedId]);
  // }

  // attachPrevious() {
  //   this.attachedId =
  //     (this.attachedId - 1 + ShipManager.ships.length) %
  //     ShipManager.ships.length;
  //     const sh = ShipManager.ships.keys().next;
  //   world.attach(ShipManager.ships[this.attachedId]);
  // }

  attachMainShip() {
    this.attachedId = -1;
    world.attach(ship);
  }
}

export const worldManager = new WorldManager();
