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
    const cx = this.wrapCellX(Math.floor(obj.x / this.cellSize));
    const cy = this.wrapCellY(Math.floor(obj.y / this.cellSize));
    const key = this.hash(cx, cy);
    const bucket = this.map.get(key) ?? [];
    bucket.push(obj);
    this.map.set(key, bucket);
  }

  insertAll(...objects: any[]) {
    for (const elements of objects) {
      for (const element of elements) {
        this.insert(element);
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
        const bucket = this.map.get(
          this.hash(this.wrapCellX(cx), this.wrapCellY(cy)),
        );
        if (bucket) results.push(...bucket);
      }
    }
    return results;
  }
}

export const spatial = new SpatialHash(world.width, world.height, 300);
