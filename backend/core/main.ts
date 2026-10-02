import WeaponManager from "./weapons/manager.ts";

import Asteroid from "./world/object/asteroid/asteroid.ts";
import { clamp } from "./utils/math.ts";

import ShipManager from "./ships/manager.ts";

import { spatial } from "./world/spatialHash.ts";
import Minature from "./weapons/minature.ts";
import { FIXED_DT } from "./utils/constants.ts";

export async function initialize() {
  if (ShipManager.ships.size <= 0) {
    console.log("init");
    Asteroid.init();
    ShipManager.init();
  }
}

let lastTime = performance.now();
let timeAccumulator = 0;

let t = 0;
async function animate() {
  t = performance.now();
  const deltaTime = clamp((t - lastTime) / 1000, 0, 1);
  lastTime = t;
  
  timeAccumulator += deltaTime;
  
  while (timeAccumulator >= FIXED_DT) {
    spatial.clear();
    spatial.insertAll(ShipManager.ships.values(), Asteroid.asteroids.values());
    
    for (const weapon of WeaponManager.weapons.values()) {
      if (weapon instanceof Minature) continue;
      spatial.insert(weapon);
    }
    
    WeaponManager.update(t, FIXED_DT);
    ShipManager.update(t, FIXED_DT);
    for (const asteroid of Asteroid.asteroids.values()) {
      asteroid.update(FIXED_DT);
    }
    
    timeAccumulator -= FIXED_DT;
  }

  // requestAnimationFrame(animate);
}
setInterval(animate)