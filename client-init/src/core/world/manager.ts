import { world } from "./world.ts";
import EnemyManager from "../player/ships/enemies/manager.ts";
import { keybinds } from "../events/keybind.ts";
import PlayerShip from "../player/ships/player.ts";
import { minimap } from "./minimap.ts";

class WorldManager {
  public attachedId: number;

  constructor() {
    this.attachedId = -1;
    this.#addKeybinds();
  }

  #addKeybinds() {
    keybinds["n"] = () => {
      this.attachNext();
    };
    keybinds["p"] = () => {
      this.attachPrevious();
    };
    keybinds["o"] = () => {
      this.attachMainShip();
    };
    keybinds["r"] = () => {
      this.attachRandom();
    };

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
    if (this.attachedId === -1) {
      return PlayerShip.ship;
    } else {
      return EnemyManager.ships[this.attachedId];
    }
  }

  attachRandom() {
    this.attachedId = Math.floor(Math.random() * EnemyManager.ships.length);
    world.attach(EnemyManager.ships[this.attachedId]);
  }

  attachNext() {
    this.attachedId = (this.attachedId + 1) % EnemyManager.ships.length;
    world.attach(EnemyManager.ships[this.attachedId]);
  }

  attachPrevious() {
    this.attachedId =
      (this.attachedId - 1 + EnemyManager.ships.length) %
      EnemyManager.ships.length;
    world.attach(EnemyManager.ships[this.attachedId]);
  }

  attachMainShip() {
    this.attachedId = -1;
    world.attach(PlayerShip.ship);
  }
}

export const worldManager = new WorldManager();
