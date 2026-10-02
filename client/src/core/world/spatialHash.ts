import { ctx } from "./canvas.ts";
import { worldToScreen, wrap } from "./utils.ts";
import { world } from "./world.ts";

class SpatialHash {
  public worldWidth;
  public worldHeight;
  public cellSize;
  public cols;
  public rows;
  public map;
  constructor(worldWidth: number, worldHeight: number, cellSize: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.cellSize = cellSize;

    this.cols = Math.ceil(worldWidth / cellSize);
    this.rows = Math.ceil(worldHeight / cellSize);

    this.map = new Map<number, any[]>();
  }

  clear() {
    this.map.clear();
  }

  hash(cx: number, cy: number) {
    return cy * this.cols + cx;
  }

  wrapCellX(cx: number) {
    return wrap(cx, this.cols);
  }

  wrapCellY(cy: number) {
    return wrap(cy, this.rows);
  }

  insert(obj: any) {
    let cx = Math.floor(obj.x / this.cellSize);
    let cy = Math.floor(obj.y / this.cellSize);

    cx = this.wrapCellX(cx);
    cy = this.wrapCellY(cy);

    const key = this.hash(cx, cy);

    if (!this.map.has(key)) {
      this.map.set(key, []);
    }

    this.map.get(key)!.push(obj);
  }

  insertAll(...object: any) {
    for (const elements of object) {
      for (const element of elements) {
        if (element !== "Minature") {
          this.insert(element);
        }
      }
    }
  }

  query(x: number, y: number, radius = this.cellSize * 2) {
    const results: any[] = [];

    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);

    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const wrappedX = this.wrapCellX(cx);
        const wrappedY = this.wrapCellY(cy);

        const key = this.hash(wrappedX, wrappedY);

        const bucket = this.map.get(key);

        if (!bucket) continue;

        for (const obj of bucket) {
          results.push(obj);
        }
      }
    }

    return results;
  }

  renderSpatialHashGrid() {
    ctx.beginPath();
    for (let cy = 0; cy < this.rows; cy++) {
      for (let cx = 0; cx < this.cols; cx++) {
        const worldX = cx * this.cellSize;
        const worldY = cy * this.cellSize;

        const { x: screenX, y: screenY } = worldToScreen(worldX, worldY, world);

        ctx.rect(screenX, screenY, this.cellSize, this.cellSize);
      }
    }
    ctx.strokeStyle = "lime";
    ctx.stroke();
  }

  renderActiveCells() {
    const cellSize = this.cellSize;

    for (const [key] of this.map) {
      const cy = Math.floor(key / this.cols);
      const cx = key % this.cols;

      const worldX = cx * cellSize;
      const worldY = cy * cellSize;

      const { x: screenX, y: screenY } = worldToScreen(worldX, worldY, world);

      ctx.fillStyle = "rgba(0,255,0,0.2)";

      ctx.fillRect(screenX, screenY, cellSize, cellSize);
      this.renderCellRadius(worldX, worldY);
    }
  }

  renderCellLabels() {
    ctx.fillStyle = "white";
    ctx.font = "12px monospace";

    for (let cy = 0; cy < this.rows; cy++) {
      for (let cx = 0; cx < this.cols; cx++) {
        const worldX = cx * this.cellSize;
        const worldY = cy * this.cellSize;

        const { x: screenX, y: screenY } = worldToScreen(worldX, worldY, world);

        ctx.fillText(`${cx},${cy}`, screenX + 5, screenY + 15);
      }
    }
  }

  renderSpatialDebug() {
    this.renderSpatialHashGrid();
    this.renderCellLabels();
    this.renderActiveCells();
  }

  renderCellRadius(x: number, y: number, radius = this.cellSize * 2) {
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);

    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    // ctx.beginPath();
    const xs = [];
    const ys = [];
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const wrappedX = this.wrapCellX(cx) * this.cellSize;
        const wrappedY = this.wrapCellY(cy) * this.cellSize;
        const { x, y } = worldToScreen(wrappedX, wrappedY, world);

        // ctx.lineTo(x, y);
        xs.push(x);
        ys.push(y);
        // ctx.fillStyle = "rgba(200, 255, 70, 0.7)";
        // ctx.beginPath();
        // ctx.arc(x, y, 10, 0, Math.PI * 2);
        // ctx.fill();
      }
    }
    // ctx.closePath()
    // ctx.stroke();

    const wMinX = Math.min(...xs);
    const wMaxX = Math.max(...xs);

    const wMinY = Math.min(...ys);
    const wMaxY = Math.max(...ys);

    ctx.strokeStyle = "rgb(255,0,0)";
    ctx.beginPath();
    ctx.moveTo(wMinX, wMinY);
    ctx.lineTo(wMaxX, wMinY);
    ctx.lineTo(wMaxX, wMaxY);
    ctx.lineTo(wMinX, wMaxY);
    // ctx.fill();
    ctx.closePath();
    ctx.stroke();
  }

  // renderCellRadius(x: number, y: number, radius = 1) {
  //   const minX = Math.floor((x - radius));
  //   const maxX = Math.floor((x + radius));

  //   const minY = Math.floor((y - radius));
  //   const maxY = Math.floor((y + radius));

  //   const { x: sMinX, y: sMinY } = worldToScreen(minX, minY, world);
  //   const { x: sMaxX, y: sMaxY } = worldToScreen(maxX, maxY, world);

  //   ctx.fillStyle = "#ff00ff10";
  //   ctx.beginPath();
  //   ctx.moveTo(sMinX, sMinY);
  //   ctx.lineTo(sMaxX, sMinY);
  //   ctx.lineTo(sMaxX, sMaxY);
  //   ctx.lineTo(sMinX, sMaxY);
  //   ctx.closePath();
  //   ctx.fill();
  // }
}

export const spatial = new SpatialHash(world.width, world.height, 300);
