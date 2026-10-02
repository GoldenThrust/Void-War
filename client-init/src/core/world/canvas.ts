// ===== CANVAS SETUP =====
export let canvas: OffscreenCanvas;

export let ctx: OffscreenCanvasRenderingContext2D;

export let canvasWidth: number, canvasHeight: number;

export const dpr = 1;
// export const dpr = window.devicePixelRatio ?? 1;

export function resizeCanvas(scale = 1) {
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(dpr * scale, dpr * scale);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
}

export function setCanvas(cs: OffscreenCanvas) {
  canvas = cs;
  ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  
  resizeCanvas();
  
  ctx.beginPath();
}
