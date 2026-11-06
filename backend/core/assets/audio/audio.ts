import type Weapon from "../../weapons/weapon";
import type Ship from "../../player/ships/ship";
import AudioManager from "./manager";
import { toroidalDelta } from "../../world/utils";
import { world } from "../../world/world";
import { minimap } from "../../world/minimap";

export default class Audio {
  public obj;
  public pannerSource: PannerNode;
  public nodes: Record<string, any>;
  constructor(obj: Weapon | Ship) {
    this.obj = obj;
    this.pannerSource = new PannerNode(AudioManager.ctx, {
      panningModel: "HRTF",
      distanceModel: "inverse",
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      refDistance: 100,
      maxDistance: Math.max(minimap.world.width, minimap.world.height) * 10,
      rolloffFactor: 1,
    });
    
    this.nodes = {};
    this.pannerSource.connect(AudioManager.ctx.destination);    
    this.createAudio();
  }

  private createAudio() {
    const ctx = AudioManager.ctx;

    this.nodes["5JaRtSRAYTOWkAt0sdhPb"] = ctx.createOscillator();
    this.nodes["5JaRtSRAYTOWkAt0sdhPb"].type = "sawtooth";
    this.nodes["5JaRtSRAYTOWkAt0sdhPb"].frequency.value = 200;
    this.nodes["5JaRtSRAYTOWkAt0sdhPb"].detune.value = 20;
    this.nodes["5JaRtSRAYTOWkAt0sdhPb"].start(0);
    this.nodes["5yQIdfobKsNZCWgl8X1Qy"] = ctx.createBiquadFilter();
    this.nodes["5yQIdfobKsNZCWgl8X1Qy"].type = "lowpass";
    this.nodes["5yQIdfobKsNZCWgl8X1Qy"].frequency.value = 100;
    this.nodes["5yQIdfobKsNZCWgl8X1Qy"].Q.value = 2;
    this.nodes["5yQIdfobKsNZCWgl8X1Qy"].gain.value = 15;
    this.nodes["1vINkvaPOg82_uTZ1Hh6R"] = ctx.createOscillator();
    this.nodes["1vINkvaPOg82_uTZ1Hh6R"].type = "sine";
    this.nodes["1vINkvaPOg82_uTZ1Hh6R"].frequency.value = 1;
    this.nodes["1vINkvaPOg82_uTZ1Hh6R"].detune.value = 0;
    this.nodes["1vINkvaPOg82_uTZ1Hh6R"].start(0);
    this.nodes["XHlurqezddWtuoT4KaCOf"] = ctx.createGain();
    this.nodes["XHlurqezddWtuoT4KaCOf"].gain.value = 100;
    this.nodes["8JD1SbGld8eVdxRR9QJAT"] = ctx.createOscillator();
    this.nodes["8JD1SbGld8eVdxRR9QJAT"].type = "sawtooth";
    this.nodes["8JD1SbGld8eVdxRR9QJAT"].frequency.value = 1;
    this.nodes["8JD1SbGld8eVdxRR9QJAT"].detune.value = 0;
    this.nodes["8JD1SbGld8eVdxRR9QJAT"].start(0);
    this.nodes["J924FBWX4R_2CGoynHHXR"] = ctx.createGain();
    this.nodes["J924FBWX4R_2CGoynHHXR"].gain.value = 1000;

    this.nodes["5JaRtSRAYTOWkAt0sdhPb"].connect(
      this.nodes["5yQIdfobKsNZCWgl8X1Qy"],
    );
    this.nodes["1vINkvaPOg82_uTZ1Hh6R"].connect(
      this.nodes["XHlurqezddWtuoT4KaCOf"],
    );
    this.nodes["XHlurqezddWtuoT4KaCOf"].connect(
      this.nodes["1vINkvaPOg82_uTZ1Hh6R"]["frequency"],
    );
    this.nodes["XHlurqezddWtuoT4KaCOf"].connect(
      this.nodes["5JaRtSRAYTOWkAt0sdhPb"]["detune"],
    );
    this.nodes["8JD1SbGld8eVdxRR9QJAT"].connect(
      this.nodes["J924FBWX4R_2CGoynHHXR"],
    );
    this.nodes["J924FBWX4R_2CGoynHHXR"].connect(
      this.nodes["5JaRtSRAYTOWkAt0sdhPb"]["frequency"],
    );
    this.nodes["J924FBWX4R_2CGoynHHXR"].connect(
      this.nodes["8JD1SbGld8eVdxRR9QJAT"]["frequency"],
    );

    this.nodes["5yQIdfobKsNZCWgl8X1Qy"]
      .connect(this.pannerSource);
  }

  update(x: number, y: number) {
    this.pannerSource.positionX.value = toroidalDelta(x, this.obj.x, world.width);
    this.pannerSource.positionY.value = toroidalDelta(y, this.obj.y, world.height);
  }

  clean() {
    // console.log("clean");
    for (const source of Object.values(this.nodes)) {
      try {
        source.stop(AudioManager.ctx.currentTime);
      } catch {}
    }
    this.pannerSource.disconnect();
  }
}
