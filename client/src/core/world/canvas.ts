// ===== CANVAS SETUP =====
export const canvas = document.querySelector("#game-canvas") as HTMLCanvasElement;

export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;


export const { width: canvasWidth, height: canvasHeight } =
  canvas.getBoundingClientRect();

export const dpr = window.devicePixelRatio ?? 1;

export function resizeCanvas(scale = 1) {
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(dpr * scale, dpr * scale);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
}

resizeCanvas();

ctx.beginPath();
