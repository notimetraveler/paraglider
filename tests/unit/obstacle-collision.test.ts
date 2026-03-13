import { describe, expect, it } from "vitest";
import { createLaunchState, simulateStep } from "@/modules/flight-model";
import { ZERO_ENVIRONMENT } from "@/modules/world/config";

describe("obstacle collision", () => {
  it("stops the aircraft on tree impact", () => {
    const state = {
      ...createLaunchState({
        x: 0,
        y: 3,
        z: 0,
        heading: 0,
        initialSpeed: 8,
      }),
      velocity: { x: 0, y: -0.2, z: 8 },
    };

    const next = simulateStep(state, 1, {
      ...ZERO_ENVIRONMENT,
      obstacleColliders: [
        { id: "tree-1", kind: "tree", x: 0, y: 0, z: 5, radius: 1.3, height: 8 },
      ],
    });

    expect(next.velocity.x).toBe(0);
    expect(next.velocity.y).toBe(0);
    expect(next.velocity.z).toBe(0);
    expect(next.position.z).toBeLessThanOrEqual(5);
  });

  it("stops the aircraft on rock impact", () => {
    const state = {
      ...createLaunchState({
        x: 0,
        y: 4,
        z: 0,
        heading: Math.PI / 2,
        initialSpeed: 8,
      }),
      velocity: { x: 8, y: -0.2, z: 0 },
    };

    const next = simulateStep(state, 1, {
      ...ZERO_ENVIRONMENT,
      obstacleColliders: [
        { id: "rock-1", kind: "rock", x: 6, y: 0, z: 0, radius: 1.8, height: 5 },
      ],
    });

    expect(next.velocity.x).toBe(0);
    expect(next.velocity.y).toBe(0);
    expect(next.velocity.z).toBe(0);
    expect(next.position.x).toBeLessThanOrEqual(6);
  });

  it("still resolves terrain collision when obstacle colliders exist", () => {
    const state = {
      ...createLaunchState({
        x: 0,
        y: 0.4,
        z: 0,
        heading: 0,
        initialSpeed: 8,
      }),
      velocity: { x: 0, y: -1.2, z: 0 },
    };

    const next = simulateStep(state, 1 / 3, {
      ...ZERO_ENVIRONMENT,
      getGroundHeight: () => 0,
      obstacleColliders: [
        { id: "tree-far", kind: "tree", x: 50, y: 0, z: 50, radius: 1.5, height: 8 },
      ],
    });

    expect(next.position.y).toBeCloseTo(0, 3);
    expect(next.velocity.y).toBe(0);
  });
});
