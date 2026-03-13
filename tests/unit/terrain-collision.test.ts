/**
 * Terrain collision - verify aircraft collides with mountain terrain.
 */

import { describe, it, expect } from "vitest";
import { createLaunchState, simulateStep } from "@/modules/flight-model";
import { ZERO_ENVIRONMENT } from "@/modules/world/config";
import { environmentFromLevel, getDefaultLevel } from "@/modules/world/level-loader";
import { getMountainTerrainHeight } from "@/modules/world/terrain";

describe("terrain collision", () => {
  it("mountain environment has getGroundHeight", () => {
    const level = getDefaultLevel();
    const env = environmentFromLevel(level);
    expect(env.getGroundHeight).toBeDefined();
    expect(env.getGroundHeight!(0, 0)).toBeGreaterThan(200);
    expect(env.getGroundHeight!(0, 220)).toBeLessThan(35);
  });

  it("aircraft collides with terrain when flying toward mountain", () => {
    const level = getDefaultLevel();
    const env = environmentFromLevel(level);
    expect(env.getGroundHeight).toBeDefined();

    let state = createLaunchState(level.launch);
    const startY = state.position.y;
    const groundAtStart = env.getGroundHeight!(state.position.x, state.position.z);
    expect(startY).toBeGreaterThan(groundAtStart);

    for (let i = 0; i < 600; i++) {
      state = simulateStep(state, 1 / 60, env);
      const groundHere = env.getGroundHeight!(state.position.x, state.position.z);
      expect(state.position.y).toBeGreaterThanOrEqual(groundHere - 0.1);
      if (state.velocity.y === 0 && state.velocity.x === 0 && state.velocity.z === 0) {
        expect(state.position.y).toBeCloseTo(groundHere, 0);
        return;
      }
    }
    expect(state.position.y).toBeGreaterThanOrEqual(
      env.getGroundHeight!(state.position.x, state.position.z) - 0.1
    );
  });

  it("aircraft never flies below ground for 20 seconds from launch (no steering)", () => {
    const level = getDefaultLevel();
    const env = { ...environmentFromLevel(level), getGroundHeight: getMountainTerrainHeight };

    let state = createLaunchState(level.launch);
    const steps = 20 * 60;

    for (let i = 0; i < steps; i++) {
      state = simulateStep(state, 1 / 60, env);
      const groundAt = getMountainTerrainHeight(state.position.x, state.position.z);
      expect(
        state.position.y,
        `Frame ${i}: y=${state.position.y.toFixed(1)} below ground ${groundAt.toFixed(1)} at (${state.position.x.toFixed(0)}, ${state.position.z.toFixed(0)})`
      ).toBeGreaterThanOrEqual(groundAt - 0.01);
    }
  });

  it("aircraft does not fall through terrain at valley", () => {
    const env = environmentFromLevel(getDefaultLevel());
    const x = 0;
    const z = 220;
    const groundAtValley = env.getGroundHeight!(x, z);

    let state = createLaunchState(getDefaultLevel().launch);
    state = {
      ...state,
      position: { x, y: groundAtValley + 5, z },
      velocity: { x: 0, y: -2, z: 0 },
    };

    for (let i = 0; i < 600; i++) {
      state = simulateStep(state, 1 / 60, env);
      if (state.velocity.y === 0) break;
    }
    const groundAtLanding = env.getGroundHeight!(state.position.x, state.position.z);
    expect(state.position.y).toBeGreaterThanOrEqual(groundAtLanding - 0.05);
    expect(state.velocity.y).toBe(0);
  });

  it("uses the ground height at the resolved contact position on rising terrain", () => {
    const env = {
      ...ZERO_ENVIRONMENT,
      getGroundHeight: getMountainTerrainHeight,
    };
    const x = 0;
    const z = 5;
    const groundAtStart = getMountainTerrainHeight(x, z);

    let state = createLaunchState({
      x,
      y: groundAtStart + 0.01,
      z,
      heading: Math.PI * 1.5,
      initialSpeed: 8,
    });
    state = {
      ...state,
      velocity: { x: -8, y: -1.3, z: 0 },
    };

    const nextState = simulateStep(state, 1 / 60, env);
    const groundAtResolvedPosition = getMountainTerrainHeight(
      nextState.position.x,
      nextState.position.z
    );

    expect(nextState.velocity.x).toBe(0);
    expect(nextState.velocity.y).toBe(0);
    expect(nextState.velocity.z).toBe(0);
    expect(nextState.position.y).toBeCloseTo(groundAtResolvedPosition, 3);
  });

  it("straight flight climbs above the valley and returns to zero height on mountain contact", () => {
    const level = getDefaultLevel();
    const env = {
      ...environmentFromLevel(level),
      thermals: [],
      getGroundHeight: getMountainTerrainHeight,
    };

    let state = createLaunchState(level.launch);
    const initialHeightAboveGround =
      state.position.y - getMountainTerrainHeight(state.position.x, state.position.z);
    let maxHeightAboveGround = initialHeightAboveGround;
    let droppedBackTowardTerrain = false;

    for (let i = 0; i < 90 * 60; i++) {
      state = simulateStep(state, 1 / 60, env);
      const groundAt = getMountainTerrainHeight(state.position.x, state.position.z);
      const heightAboveGround = state.position.y - groundAt;

      expect(heightAboveGround).toBeGreaterThanOrEqual(-0.01);
      maxHeightAboveGround = Math.max(maxHeightAboveGround, heightAboveGround);

      if (maxHeightAboveGround > initialHeightAboveGround + 20) {
        droppedBackTowardTerrain =
          droppedBackTowardTerrain || heightAboveGround < maxHeightAboveGround - 20;
      }

      if (state.velocity.x === 0 && state.velocity.y === 0 && state.velocity.z === 0) {
        expect(heightAboveGround).toBeCloseTo(0, 1);
        break;
      }
    }

    expect(maxHeightAboveGround).toBeGreaterThan(initialHeightAboveGround + 20);
    expect(droppedBackTowardTerrain).toBe(true);
  });
});
