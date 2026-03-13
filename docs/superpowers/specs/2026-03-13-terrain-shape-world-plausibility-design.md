# Terrain Shape & World Plausibility — Design

> Step 21: refine the mountain world into a more believable alpine paraglider environment without changing paraglider controls or intentional flight feel.

## Goals

- Make the terrain read as a credible alpine flying site from FPV.
- Improve macro forms: launch ridge, flanks, valley floor, landing basin, and secondary mountain mass.
- Ground all world objects deterministically on the same terrain source.
- Add simple, believable tree/rock collisions without rewriting the flight model.
- Preserve gameplay readability for launch, gates, thermals, landing zone, and windsock.

## Explicit Non-Goals

- No changes to keyboard controls.
- No changes to input smoothing.
- No retuning of brake, steer, accel, sink, turn, or flare behavior unless required for a bug fix.
- No heavy physics engine or triangle-mesh collision system.
- No broad rewrite of world/rendering architecture beyond what this step needs.

## Current Problems

### Terrain shape

1. The terrain is mostly two symmetric gaussian hills with light noise, so it reads like a test profile rather than an alpine massif.
2. The launch area lacks a clear ridge, shoulder, and descending flank structure.
3. The valley and second mountain are too axis-aligned and uniform to feel like a believable route through terrain.

### Physical plausibility

1. Trees, rocks, and water are placed in rendering code rather than from shared world composition data.
2. Trees and rocks have no collision, so the glider can pass through them.
3. Placement logic is only partially terrain-aware, which risks floating or implausible objects as terrain evolves.

## Design Direction

### 1. Terrain macro composition

Replace the current “two hills + noise” height field with an analytical composition built from a few large readable forms:

- a launch massif with an asymmetric ridge and shoulders
- a central valley corridor with a flatter landing basin
- a secondary mountain wall beyond the valley
- side ridges/flanks that frame the route without becoming cluttered
- low-amplitude micro variation layered only after macro forms are established

This keeps terrain deterministic and testable while producing stronger long-range readability from FPV.

### 2. Shared world composition layer

Introduce a small shared world-object definition layer for deterministic scene composition. This layer becomes the source of truth for:

- tree clusters
- rock outcrops / landmarks
- water zones
- obstacle collider volumes
- keep-clear zones around launch, landing, and critical route corridors

Rendering consumes this data for mesh placement. Physics consumes the same data for obstacle collision.

### 3. Grounded placement rules

All fixed objects must be placed using terrain sampling and local suitability checks:

- trees only in valid low-slope valley/meadow zones
- rocks only on plausible rocky shoulders, ridges, or steeper flanks
- water only in explicit low basin zones
- launch and landing approach corridors remain clear

Each placed object is anchored to `terrainHeightAt(x, z)` and gets an offset only when the mesh itself requires a base elevation above the contact point.

### 4. Obstacle collision

Add a lightweight obstacle collision pass to the simulation using simple volumes:

- trees: cylinder or sphere-like trunk/canopy proxy
- rocks: sphere/capsule-ish proxy per outcrop

Collision is resolved similarly to terrain contact:

- sweep from previous to next position
- stop at first obstacle contact
- clamp position to the contact point
- zero velocity for a clear, consistent impact outcome

This preserves performance and integrates cleanly with existing terrain collision logic.

## Architecture Changes

### `modules/world/terrain.ts`

- Expand analytical terrain helpers into named macro-shape building blocks.
- Add helpers for suitability/zone queries needed by placement and tests.
- Keep `terrainHeightAt` as the single height source for HUD, render, landing, and collision.

### New shared world helpers

Add a focused world composition module that defines:

- world objects / placements
- placement suitability helpers
- obstacle collider definitions

### `modules/rendering/scene-decor.ts`

- Stop hardcoding decor directly from local constants.
- Render from shared world composition output.

### `modules/rendering/fpv-scene.ts`

- Build decor and obstacle visuals from shared composition.
- Keep existing readability features, but place them relative to improved terrain.

### `modules/flight-model/simulate.ts`

- Add an obstacle collision pass alongside terrain collision.
- Do not change control response or aerodynamic tuning.

## Testing Strategy

Add or update tests for:

- terrain macro-shape invariants
- slope/zone helper logic
- object placement suitability and grounding
- obstacle collision helpers
- regression coverage for non-floating decor and no-penetration behavior

Validation required after implementation:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Acceptance Criteria

- The launch reads as a ridge / massif, not a simple rounded bump.
- The valley and landing basin are spatially convincing from FPV.
- Trees, rocks, and water are placed deterministically and grounded to terrain.
- The glider can no longer pass through relevant fixed obstacles.
- Launch, gates, thermals, windsock, and landing remain readable and usable.
- Existing paraglider controls are unchanged.
