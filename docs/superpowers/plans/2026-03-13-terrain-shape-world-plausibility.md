# Terrain Shape & World Plausibility Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the mountain terrain into a more believable alpine world, ground world objects on the terrain source of truth, and add simple obstacle collisions without changing paraglider controls.

**Architecture:** Keep `terrainHeightAt` as the single source of truth while expanding it into richer macro terrain forms. Move decor placement to a shared world-composition layer consumed by both rendering and physics, and add lightweight obstacle sweep collisions in the simulation.

**Tech Stack:** TypeScript, Next.js, Three.js, Vitest, ESLint

---

## Chunk 1: Terrain Macro Shape

### Task 1: Add failing terrain-shape regression tests

**Files:**
- Modify: `tests/unit/terrain.test.ts`
- Modify: `modules/world/terrain.ts`

- [ ] **Step 1: Write failing tests for macro terrain composition**

Add tests for:
- launch ridge / massif being higher than nearby valley floor
- landing basin being lower and flatter than surrounding slopes
- secondary mountain wall reading as a broad mass instead of a narrow bump
- terrain helper(s) for valley-ness / ridge-ness / local suitability behaving deterministically

- [ ] **Step 2: Run targeted tests to verify they fail**

Run: `npx vitest run tests/unit/terrain.test.ts`

Expected: FAIL because the new macro-shape invariants/helpers do not exist yet.

- [ ] **Step 3: Implement minimal terrain helper and height-field changes**

Update `modules/world/terrain.ts` to:
- replace the simple 2-hill composition with named macro-shape helpers
- keep deterministic sampling
- preserve `terrainHeightAt` as the shared source of truth

- [ ] **Step 4: Re-run targeted terrain tests**

Run: `npx vitest run tests/unit/terrain.test.ts`

Expected: PASS

## Chunk 2: Shared World Composition & Grounded Placement

### Task 2: Add shared world object placement definitions

**Files:**
- Create: `modules/world/obstacles.ts`
- Modify: `modules/rendering/scene-decor.ts`
- Modify: `modules/rendering/fpv-scene.ts`
- Test: `tests/unit/world-obstacles.test.ts`

- [ ] **Step 1: Write failing tests for placement and grounding**

Add tests for:
- tree placements use terrain height and valid terrain zones
- rock placements sit on plausible terrain zones
- water zone remains in a logical basin
- launch / landing keep-clear rules are respected

- [ ] **Step 2: Run targeted placement tests to verify they fail**

Run: `npx vitest run tests/unit/world-obstacles.test.ts`

Expected: FAIL because the shared placement module does not exist yet.

- [ ] **Step 3: Implement shared world object / obstacle helpers**

Create a focused module that exports:
- world object definitions
- terrain-aware placement helpers
- simple collider metadata for relevant objects

- [ ] **Step 4: Rewire decor rendering to use shared world composition**

Update scene decor/rendering to render trees, rocks, and water from shared definitions instead of ad hoc hardcoded placement.

- [ ] **Step 5: Re-run targeted placement tests**

Run: `npx vitest run tests/unit/world-obstacles.test.ts`

Expected: PASS

## Chunk 3: Obstacle Collision

### Task 3: Add failing obstacle collision tests

**Files:**
- Modify: `modules/flight-model/simulate.ts`
- Modify: `modules/world/types.ts`
- Modify: `modules/world/level-loader.ts`
- Test: `tests/unit/obstacle-collision.test.ts`

- [ ] **Step 1: Write failing collision tests**

Add tests for:
- aircraft stops on tree obstacle contact
- aircraft stops on rock obstacle contact
- aircraft still respects terrain collision
- obstacle collision does not require any control changes

- [ ] **Step 2: Run targeted collision tests to verify they fail**

Run: `npx vitest run tests/unit/obstacle-collision.test.ts`

Expected: FAIL because environment obstacle colliders are not yet used by the simulator.

- [ ] **Step 3: Implement lightweight obstacle sweep collision**

Add a collision pass that:
- uses simple colliders from the shared world module
- checks motion segment against colliders
- resolves first contact with a consistent stop outcome

- [ ] **Step 4: Re-run targeted collision tests**

Run: `npx vitest run tests/unit/obstacle-collision.test.ts`

Expected: PASS

## Chunk 4: Render / Gameplay Integration

### Task 4: Align route composition with refined terrain

**Files:**
- Modify: `modules/world/levels/mountain-01.ts`
- Modify: `modules/rendering/fpv-scene.ts`
- Modify: `tests/unit/level-loader.test.ts`

- [ ] **Step 1: Write failing route/readability regression tests if needed**

Add or update tests that assert:
- launch height resolves from improved terrain
- landing zone remains in a low, reachable basin
- route objects stay consistent with level layout

- [ ] **Step 2: Run targeted tests**

Run: `npx vitest run tests/unit/level-loader.test.ts`

Expected: FAIL only if the new route composition requires updated expectations.

- [ ] **Step 3: Implement minimal layout adjustments**

Adjust only the level/world composition needed so launch, valley route, and landing remain readable within the refined terrain.

- [ ] **Step 4: Re-run targeted tests**

Run: `npx vitest run tests/unit/level-loader.test.ts`

Expected: PASS

## Chunk 5: Full Verification

### Task 5: Validate project state

**Files:**
- Verify only

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Run tests**

Run: `npm run test`

Expected: PASS

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS
