import type Audio from "./audio";
import { audioCtx } from "./context";

export default class AudioManager {
  static audios: Audio[] = [];
  static ctx = audioCtx;
  

  // constructor(x: number, y: number) {
  constructor() {
    // The listener is kept at the player's position; sources use wrapped offsets.
  }

  static set set(audio: Audio) {
    AudioManager.audios.push(audio);
  }

  static get get() {
    return AudioManager.audios;
  }

  static update(x: number, y: number, angle: number) {
    const listener = AudioManager.ctx.listener;
    listener.positionX.value = 0;
    listener.positionY.value = 0;
    listener.positionZ.value = 0;
    listener.forwardX.value = -Math.sin(angle);
    listener.forwardY.value = -Math.cos(angle);
    listener.forwardZ.value = 0;

    for (const audio of AudioManager.audios) {
      audio.update(x, y);
    }
  }
}
