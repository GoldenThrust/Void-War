declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: unknown);
  abstract process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processor: new (options?: unknown) => AudioWorkletProcessor,
): void;

declare const sampleRate: number;

class EngineProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "gain", defaultValue: 0.08, minValue: 0, maxValue: 1 },
      { name: "speed", defaultValue: 0, minValue: 0, maxValue: 1 },
    ];
  }

  private phase = 0;

  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ) {
    const output = outputs[0];
    const left = output[0];
    const right = output[1] ?? left;
    const gains = parameters.gain;
    const speeds = parameters.speed;

    for (let index = 0; index < left.length; index++) {
      const speed = speeds.length === 1 ? speeds[0] : speeds[index];
      const gain = gains.length === 1 ? gains[0] : gains[index];
      const frequency = 90 + speed * 180;
      this.phase += frequency / sampleRate;
      this.phase %= 1;
      const sample = (2 * this.phase - 1) * gain;
      left[index] = sample;
      right[index] = sample;
    }

    return true;
  }
}

registerProcessor("void-war-engine", EngineProcessor);