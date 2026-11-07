import { io } from "socket.io-client";
import { wsServerUrl } from "../utils/constants";

// function toroidalLerp(
//   current: number,
//   target: number,
//   t: number,
//   size: number,
// ) {
//   const clampedT = Math.max(0, Math.min(1, t));
//   let delta = target - current;
//   if (delta > size * 0.5) delta -= size;
//   if (delta < -size * 0.5) delta += size;

//   return (((current + delta * clampedT) % size) + size) % size;
// }

export default class Websocket {
  public socket;

  constructor(url: string) {
    this.socket = io(url, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.25,
    });

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server:", reason);
    });
    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection failed:", error.message);
    });
    console.log("WebSocket initialized");
  }
}

export const ws = new Websocket(wsServerUrl);