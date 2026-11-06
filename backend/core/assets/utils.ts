import { audioCtx } from "./audio/context.ts";

export function playAudio(buffer: AudioBuffer, gain: AudioNode, loop = false) {
    const source = audioCtx.createBufferSource();

    source.connect(gain).connect(audioCtx.destination);

    source.loop = loop;
    source.buffer = buffer;
    source.start();

    return source;
}

export function throtlePlayAudio(buffer: AudioBuffer, gain: AudioNode) {
    let playing = false;
            console.log("throtle audio");


    return () => {
            console.log("player audio");
        if (!playing) {
            console.log("playing audio");
            playing = true;
            const source = playAudio(buffer, gain);
            source.onended = () => {
                playing = false;
            }
        }
    }
}