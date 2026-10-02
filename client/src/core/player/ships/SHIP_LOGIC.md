# Ship Logic and AI Guide

This document explains the current ship system in `src/core/player/ships` and the weapon behavior that the ships depend on.

The goal of the system is to make every ship follow the same safe combat loop while allowing each ship class to specialize:

1. Move using the shared physics model.
2. Look for incoming enemy weapons.
3. Evade an immediate threat and attempt to shoot it down.
4. Acquire and retain an enemy target.
5. Select a combat state: seek, orbit, flee, or idle.
6. Turn toward the target using toroidal world coordinates.
7. Fire only when the assigned weapon has a useful firing solution.

## Important Coordinate Convention

A ship's `angle` points along this forward vector:

```text
forwardX = -sin(angle)
forwardY = -cos(angle)
```

This means angle `0` points toward negative Y. Any target-angle calculation must use:

```text
angle = atan2(-deltaX, -deltaY)
```

The world wraps horizontally and vertically. Distance and direction must therefore use the toroidal helpers instead of direct subtraction.

## Runtime Update Flow

The main loop rebuilds the spatial hash, inserts ships and active weapons, updates weapons, and then updates ships. This means ship AI can inspect weapons from the previous simulation step before moving for the current step.

`ShipManager.update()` calls `update(t, dt)` for every ship. Each drone first calls `super.update()` for movement and weapon heat/cooldown maintenance, then calls `tacticalUpdate()` with its own combat profile.

The player uses the same base movement and weapon code, but keyboard input controls its steering, thrust, and firing.

# Base Ship: `ship.ts`

## Constructor

`constructor(options)` initializes the common ship state.

It sets:

- Position and orientation: `x`, `y`, and `angle`.
- Physical values: `speed`, `acceleration`, `width`, and `height`.
- Identity: `name`, `color`, and `friend`.
- Rendering assets and collision vertices.
- The assigned weapon constructor.
- Life, heat, cooldown, and weapon lockout state.
- A speed-dependent trail.
- Two acceleration values used by AI:
  - `seekAcceleration` for normal pursuit and positioning.
  - `fleeAcceleration` for emergency movement.
- `lastDt`, which lets steering use the current fixed simulation step.
- `targetScanTimer`, which prevents expensive target searches every frame.
- The private squad-target map used by Fleet drones.

The ship starts in the `idle` state. AI changes that state to `seek`, `orbit`, `flee`, or `evade`.

## `render()`

Draws the ship's engine trail, health bar, flame image, and ship image or fallback polygon.

The health bar is green for friendly ships and red for enemy ships. Rendering uses `drawWrapped()` so a ship near a world boundary can still appear correctly on screen.

This function does not make AI decisions.

## `update(_t, dt, thrust = 0, turn = 0)`

Runs the shared movement and weapon-maintenance simulation.

### Player behavior

If `controllable` is true:

- Left and right arrows override the requested turn value.
- Up increases speed.
- Down reduces speed without allowing negative speed.
- Space, Enter, or the configured space key calls `fire()`.

### AI behavior

Non-player ships accelerate according to their current state. Ships with a non-idle AI state accelerate normally. Idle ships continue drifting forward.

The angle is changed by:

```text
angle += turn * turnRate * speedFactor * dt
```

`speedFactor` prevents a stationary ship from turning unrealistically quickly while still allowing low-speed steering.

The position is then advanced using the forward vector and wrapped to the world dimensions.

The function also:

- Updates the trail.
- Reduces weapon cooldown.
- Cools weapon heat.
- Changes the weapon state from `cool` to `hot` when heat reaches the limit.
- Changes it back to `cool` after the weapon fully recovers.

## `canFire()`

Returns true only when all of these conditions are true:

- Cooldown has expired.
- Current heat is below the weapon heat limit.
- Weapon state is `cool`.

This is the final safety gate for every weapon launch.

## `fire()`

Fires the assigned weapon from the ship's current position and angle.

It delegates to `fireFrom()` so special ships can fire from a tactical position, such as the Miner placing a mine ahead of an enemy.

## `fireFrom(x, y, angle)`

Attempts to fire from an explicit position and angle.

It wraps the spawn position, builds the weapon launch properties, and calls `WeaponManager.fire()`.

The projectile receives:

- The launch position.
- The launch angle.
- The ship's current speed.
- A reference to the firing ship.
- A friendly or enemy color.

It returns false when firing is blocked and true after a weapon is created.

## `setCoolDown(value)`

Sets the number of simulation steps before the ship may fire again.

Weapon constructors call this automatically using their fire rate.

## `increaseHeat(value)`

Adds weapon energy usage to the ship's heat value.

Every weapon constructor calls this when a projectile is created. This means energy cost is enforced by the weapon definition rather than by individual ship classes.

## `setMaxHeat()`

Immediately marks the weapon as hot. This is available for effects that need to force a weapon lockout.

## `getVertices()`

Transforms the ship's local polygon vertices into current screen-space vertices.

Collision code uses this result when a weapon hits a ship.

## `destroy()`

Delegates removal to `ShipManager.destroy()`.

The manager marks the ship dead, creates an explosion, removes it from the active list, and stores it in `destroyedShips`.

## `follow(ship)`

Legacy steering helper that turns toward a ship using `toroidalDirection()`.

The `flee` state changes the tangent direction so the ship attempts to move away instead of toward the target. The current tactical controller uses `steerTo()` and predictive angles directly, but this helper remains available for older behavior and compatibility.

## `closeWeapon(_, dist, alpha)`

Legacy close-weapon response.

When an object is close and near the ship's side, the function may fire and apply a small turn adjustment. The newer threat system uses `findThreat()` and `evadeThreat()` for predictive behavior, so this method is mainly a compatibility hook for callers that still use `nearByWeapon()`.

## `closeEnemy(ship, _dist, _alpha)`

Stores a discovered enemy as the current target.

The distance and angle arguments are retained for compatibility with older spatial-search code.

## `getSquadTarget(friend)`

Reads the shared target for one friendly or enemy side.

A target is discarded if it is dead or has no remaining life. Fleet drones use this to focus the whole squad on one enemy.

## `setSquadTarget(friend, target)`

Stores a target for one squad side.

The map is keyed by the boolean `friend` value, so friendly Fleet drones and enemy Fleet drones have separate shared targets.

## `getNearbyAllies(radius)`

Queries the spatial hash and returns living ships on the same side.

It is useful for local formation behavior. Fleet role assignment currently uses stable spawn slots, while this helper remains available for nearby formation or support behaviors.

## `findThreat(radius = 1600)`

Searches nearby spatial-hash objects for enemy weapons that could hit the ship.

Friendly weapons are ignored. Inactive weapons are ignored.

For moving projectiles, it computes:

- `forwardDistance`: how far ahead the projectile's forward direction the ship is.
- `lateralDistance`: how far the ship is from the projectile's line.
- `time`: estimated time until the projectile reaches the ship's forward position.
- `distance`: direct toroidal distance.

A projectile is considered dangerous when:

- It is moving toward the ship.
- It reaches the ship within the prediction window.
- Its lateral distance is inside the ship's collision envelope.

Mines and nearly stationary weapons use a simpler proximity rule because they do not provide a reliable moving-intercept calculation.

The earliest predicted threat is returned.

## `evadeThreat(threat)`

Turns the ship perpendicular to the incoming weapon's path.

The side of the projectile line is calculated with a 2D cross-product-style sign. The ship then chooses the perpendicular direction that moves it away from the projectile's approach line.

The ship enters the `evade` state and uses `fleeAcceleration`. This makes evasion a movement decision rather than only a visual turn.

## `nearByWeapon(radius)`

Queries nearby weapons and passes them to `closeWeapon()`.

This is the older reactive API. The main tactical path uses `findThreat()` instead because it predicts projectile motion and can make a better decision before collision range.

## `nearByTarget(radius = 12000)`

Acquires and retains an enemy target.

The process is:

1. Reduce the target scan timer.
2. Keep a living target without scanning every frame.
3. Scan at most once every `0.2` seconds.
4. Keep the current target if it remains within four times the search radius.
5. Otherwise scan the active ship list and choose the nearest enemy inside the search radius.

Using the active ship list avoids a very large spatial-hash query for long-range target acquisition.

The target is not dropped simply because it moves outside the first scan radius. This lets ships pursue instead of repeatedly losing and reacquiring the same enemy.

## `steerTo(angle, multiplier = 1)`

Turns toward the shortest angular path.

The angular error is normalized to the range `-PI` through `PI`. Turning is clamped by `turnRate * multiplier` and scaled by `lastDt`.

This prevents ships from spinning the long way around and lets individual ship roles turn at different rates.

## `angleToTarget(target, lead = 0)`

Calculates the angle from the ship to a moving target.

It uses toroidal X and Y deltas and adds a simple lead estimate based on the target's current heading and speed.

The result follows the ship coordinate convention:

```text
atan2(-(targetDeltaX + leadX), -(targetDeltaY + leadY))
```

The lead value is larger for slow-firing weapons such as the rail gun and missiles, and smaller for rapid weapons.

## `tacticalUpdate(profile)`

This is the central AI decision function.

The profile controls:

- `searchRange`: target acquisition range.
- `idealRange`: preferred combat distance.
- `fleeRange`: emergency retreat distance.
- `fireRange`: maximum firing distance.
- `fireArc`: allowed aim error.
- `orbit`: lateral movement around the target.
- `lead`: predictive aiming amount.
- `turnMultiplier`: role-specific turn speed.
- `fire`: whether the normal weapon may fire.

The decision order is intentional:

### 1. Threat response

`findThreat()` runs first. If an incoming enemy weapon is dangerous:

- The ship enters `evade`.
- It turns perpendicular to the threat.
- It accelerates away.
- It attempts to fire at the weapon if it is close enough and inside a defensive aim arc.
- Normal enemy firing is paused for that decision step.

This gives survival priority over damage output.

### 2. Target acquisition

If there is no urgent threat, `nearByTarget()` finds or retains an enemy.

If no valid target exists, the ship enters `idle` and uses its normal acceleration.

### 3. Combat state

For a valid target:

- `flee` is selected when the target is inside `fleeRange`.
- `seek` is selected when the ship is farther than `idealRange`.
- `orbit` is selected when it is close enough to hold position around the target.

### 4. Steering

The ship turns toward the target, or away from it when fleeing. The orbit value adds a perpendicular steering component so ships do not fly directly into one another.

### 5. Firing

Normal firing happens only when:

- The target is within `fireRange`.
- The target is inside `fireArc`.
- `canFire()` allows the assigned weapon to launch.

This reduces wasted bullets and lets each weapon use a different precision standard.

# Ship Roles

## Bomber: `bomber.ts`

Weapon: `PlasmaCanon`

The Bomber is a close-to-mid-range damage ship.

Its profile uses:

- Preferred range: `1800`.
- Retreat range: `450`.
- Fire range: `7000`.
- Moderate firing arc.
- Small predictive lead.

Logic:

1. Move toward the enemy until the preferred range.
2. Orbit or retreat when too close.
3. Lead the target slightly because plasma projectiles take time to arrive.
4. Fire when the target is inside a forgiving arc.

## Fleet Drone: `fleet.ts`

Weapon: `PulseCanon`

Fleet drones are squad attackers.

Each drone receives a stable formation slot when constructed. The slot determines:

- Which side of the target it orbits.
- Which of three preferred ranges it occupies.

The drone first checks the squad's shared target. If one Fleet drone has acquired an enemy, it publishes that target so other Fleet drones focus the same enemy instead of scattering across unrelated enemies.

Its profile uses:

- Search range: `16000`.
- Preferred formation ranges: `1800`, `2150`, or `2500`.
- Retreat range: `700`.
- Narrow firing arc.
- Small lead value.

The result is a layered squad: drones approach the same enemy, orbit from alternating sides, and fire with coordinated focus.

## Miner: `miner.ts`

Weapon: `Mine`

The Miner is a defensive area-denial ship.

It disables normal firing in `tacticalUpdate()` because a mine should not be spawned at the Miner's own muzzle by the generic firing logic.

When a target is inside `3200` units and the mine can fire, the Miner places the mine at a point `600` units ahead of the target's current heading:

```text
mineX = targetX - sin(targetAngle) * 600
mineY = targetY - cos(targetAngle) * 600
```

This puts the mine in the enemy's likely path instead of directly behind the Miner.

The Miner retreats early at `850` units because its defensive value comes from controlling space rather than winning a close-range duel.

## Missile Launcher: `missileLaucher.ts`

Weapon: `HomingMissile`

The Missile Launcher stays farther away and uses a large predictive lead.

Its profile uses:

- Preferred range: `4200`.
- Retreat range: `1200`.
- Fire range: `10000`.
- Wide firing arc because the missile can correct after launch.
- Lead: `1.2`.
- Lower steering multiplier to keep the launcher stable at range.

The launcher does not need perfect initial alignment, but it still avoids firing when the target is completely outside the launch arc.

## Sniper: `sniper.ts`

Weapon: `HeavyRailGun`

The Sniper is a long-range precision ship.

Its profile uses:

- Preferred range: `14000`.
- Retreat range: `3500`.
- Fire range: `30000`.
- Very narrow firing arc.
- Large lead: `1.5`.
- Low turn speed to encourage deliberate positioning.

The narrow arc and large lead are intentional. The rail gun has high damage and penetration, so it should fire less often but with a better firing solution.

## Tormenter: `tormenter.ts`

Weapon: `GatlingGun`

The Tormenter is an aggressive tracking attacker.

Its profile uses:

- Preferred range: `950`.
- Retreat range: `300`.
- Fire range: `3800`.
- Very narrow firing arc.
- Moderate lead.
- High turn multiplier.
- Orbiting movement.

The Tormenter chases quickly, turns hard, and fires only when its aim is tightly aligned. This prevents random bullet spraying while preserving its close-range pressure role.

# Player Ship: `player.ts`

## `PlayerShip.constructor(options)`

Creates the controllable player ship using the shared `Ship` base class.

It always uses:

- Friendly faction.
- Player image and flame image.
- Pulse Cannon.
- High life.
- Keyboard control.

## `heatPercent`

Returns the player's current weapon heat as a rounded percentage for UI display.

## `update(t, dt)`

Delegates movement, keyboard handling, cooling, and manual firing to `Ship.update()`.

## `PlayerShip.spawn(x, y)`

Creates the player at a randomized offset from the supplied world position and adds it to `ShipManager.ships`.

# Ship Manager: `manager.ts`

## `ShipManager.ships`

The active ship collection. It contains friendly drones, enemy drones, and the player ship after spawning.

## `ShipManager.types`

The pool of AI ship classes used for random spawning:

- FleetDrone
- Bomber
- MissileLaucher
- Sniper
- Tormenter
- Miner

## `init()`

Creates the configured number of enemy and friendly ships at random world positions.

Each ship receives a random heading and faction flag.

## `destroy(ship)`

Removes a ship from the active collection, marks it as dead, creates an explosion, and records it in `destroyedShips`.

## `render()`

Calls `render()` for every active ship.

## `update(t, dt)`

Calls `update()` for every active ship once per simulation step.

# Weapon Interaction

## `Weapon` ownership

Every weapon stores its firing ship in `weapon.ship`. This is how ship AI determines whether a projectile is friendly or hostile.

## Projectile collision

`Weapon.nearBy()` checks nearby spatial objects. Enemy projectiles can collide with enemy ships and other weapons. Therefore, when a ship fires at an incoming hostile projectile, the projectile can be destroyed by normal weapon collision logic.

## Homing Missile

`HomingMissile.trackEnemy(dt)` uses toroidal target deltas and the same ship forward convention:

```text
targetAngle = atan2(-deltaX, -deltaY)
```

It rotates toward the target by a frame-scaled maximum turn rate.

`closeObject(object)` only accepts living enemy `Ship` instances and keeps the nearest valid enemy as the missile target. Asteroids, weapons, friendly ships, and unrelated objects are ignored.

# AI State Summary

| State | Meaning | Movement |
| --- | --- | --- |
| `idle` | No valid enemy target | Forward drift using normal acceleration |
| `seek` | Too far from target | Move toward target |
| `orbit` | Inside preferred range | Move laterally around target |
| `flee` | Target is dangerously close | Turn away and accelerate |
| `evade` | Incoming weapon predicted to hit | Turn perpendicular to threat and accelerate |
| `dead` | Removed or destroyed ship | No longer an active combat unit |

# Design Principles

## Threats override damage

A ship that survives can continue dealing damage. When an incoming projectile is predicted to hit, evasion and interception take priority over normal target fire.

## Weapons define ship identity

The AI does not use one universal firing style. Profiles are tuned to the assigned weapon's strengths:

- Plasma favors close-to-mid range.
- Pulse favors coordinated formation fire.
- Mines deny space.
- Homing missiles tolerate wider launch angles.
- Rail guns demand precision and lead.
- Gatling guns support aggressive close pursuit.

## Targets are retained

Repeatedly switching targets makes ships look indecisive and causes wasted bullets. The target scan timer and target retention rules keep ships committed to a valid enemy during pursuit.

## Toroidal math is mandatory

Direct subtraction fails near world edges. All combat distance and direction calculations use toroidal helpers so ships can track and fire correctly across wrap boundaries.

# Known Boundaries

- `closeWeapon()` and `nearByWeapon()` are retained legacy APIs. The active tactical path uses `findThreat()` and `evadeThreat()`.
- The current build may still report unrelated errors outside the ship system. Ship and weapon diagnostics should be checked separately when debugging AI changes.
- The AI is deterministic from its current inputs. More advanced behavior, such as squad formations based on exact leader positions, could be added later on top of the shared squad target system.
