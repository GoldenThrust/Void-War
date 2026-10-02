import { wrap } from "./utils.ts";
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
}

export const spatial = new SpatialHash(world.width, world.height, 300);
