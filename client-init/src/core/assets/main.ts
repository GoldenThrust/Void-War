// import { audioCtx } from "./audio/context.ts";
import { assetsUrl } from "./urls.ts";

export const assets: Record<string, any> = {};

function loadImage(src: string) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.src = `/img/${src}`;
    img.onload = () => {
      res(img);
    };
    img.onerror = rej;
  });
}

function loadVideo(src: string) {
  return new Promise((res, rej) => {
    const vid = document.createElement("video");
    vid.src = `/video/${src}`;

    vid.muted = true;
    vid.loop = true;
    vid.autoplay = true;
    vid.onloadeddata = () => {
      vid.play();
      res(vid);
    };

    vid.onerror = rej;
  });
}

export function loadAudio(src: string) {
  return new Promise(async (res, rej) => {
    try {
      const response = await fetch(`/audio/${src}`);
      const audioData = await response.arrayBuffer();

      // const buffer = audioCtx.decodeAudioData(audioData);
      const buffer = null;

      res(buffer);
    } catch (error) {
      rej(error);
    }
  });
}

const loaders: Record<string, (src: string) => Promise<unknown>> = {
  images: loadImage,
  videos: loadVideo,
  audios: loadAudio,
};

export async function buildAssets() {
  await Promise.all(
    Object.entries(assetsUrl).map(async ([type, paths]) => {
      const loader = loaders[type];
      if (!loader) return;
      assets[type] = {};

      for (const [name, src] of Object.entries(paths)) {
        // assets[type][name] = await loader(src);
      }
    }),
  );
}
