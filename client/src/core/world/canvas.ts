// ===== CANVAS SETUP =====
export const canvas = document.querySelector("#game-canvas") as HTMLCanvasElement;

export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;


export const { width: canvasWidth, height: canvasHeight } =
  canvas.getBoundingClientRect();

export const dpr = window.devicePixelRatio ?? 1;

export function resizeCanvas(scale = 1) {
  const width = canvasWidth * dpr;
  const height = canvasHeight * dpr;
  if (canvas.width === width && canvas.height === height) return;

  canvas.width = width;
  canvas.height = height;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(dpr * scale, dpr * scale);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
}

window.addEventListener("resize", () => resizeCanvas());


resizeCanvas();

ctx.beginPath();
