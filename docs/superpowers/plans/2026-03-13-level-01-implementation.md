# Level 01 (Fjordvallei) — implementation summary

**Spec:** docs/LEVEL_01_WORLD_SPEC.md, docs/ART_DIRECTION.md.

## Goals (short)

- Scenic alpine fjord valley: launch mountain, broad valley, main water body, forested slopes, rocky ridges, bridge, roads, sparse buildings, clear landing field.
- FPV readable, no primitive look, all objects grounded on terrain; gates/thermals/landing gameplay preserved.

## Implemented

1. **Macro terrain** — `LANDING_BASIN_Z` 312 (LZ center); `FJORD_CENTER` (0, 248); fjord depression + valley carve + landing basin + valley apron; basin floor tuned.
2. **Obstacles** — Landing clear zone at z=312; main water id `water-fjord` at (0, 248); 8 tree clusters (west/east/south), 6 rock specs (ridges + sidewalls); two side inlets.
3. **Level data** — Name "Fjordvallei"; wind (-2, 0); two thermals (with strength); gates at z 168, 238, 292; LZ (0, 312, 70).
4. **Settlement** — Bridge over fjord (z=248); 3 road segments; 3 building boxes; all Y from `terrainHeightAt`, only for level id `mountain-01`.

## Files changed

- `modules/world/terrain.ts` — constants, fjord depression, landing basin position.
- `modules/world/obstacles.ts` — LZ 312, fjord lake, tree/rock specs.
- `modules/world/levels/mountain-01.ts` — name, wind, thermals (with strength), gates.
- `modules/rendering/fpv-scene.ts` — `addLevel01Settlement()` (bridge, roads, buildings).
- `tests/unit/level-loader.test.ts` — default level name, wind/thermals assertions.
- `tests/unit/world-obstacles.test.ts` — water id `water-fjord`, z range.

## Paraglider controls

No changes to flight model, input, or flight feel.
