import { describe, it, expect } from "vitest";
import { createLaunchState, simulateStep } from "@/modules/flight-model";
import { deriveFlightState, isLanded } from "@/modules/game-session";
import { LAUNCH_CONFIG, ZERO_ENVIRONMENT } from "@/modules/world/config";

describe("launch-land-restart flow", () => {
  it("createLaunchState uses world config with forward velocity", () => {
    const state = createLaunchState();
    expect(state.position.x).toBe(LAUNCH_CONFIG.x);
    expect(state.position.y).toBe(LAUNCH_CONFIG.y);
    expect(state.position.z).toBe(LAUNCH_CONFIG.z);
    expect(state.heading).toBe(LAUNCH_CONFIG.heading);
    expect(state.airspeed).toBe(LAUNCH_CONFIG.initialSpeed);
    const horizontalSpeed = Math.sqrt(
      state.velocity.x ** 2 + state.velocity.z ** 2
    );
    expect(horizontalSpeed).toBeGreaterThan(0);
    expect(state.velocity.y).toBeLessThan(0);
  });

  it("restart resets to equivalent of createLaunchState", () => {
    const restarted = createLaunchState();
    expect(restarted.position).toEqual({
      x: LAUNCH_CONFIG.x,
      y: LAUNCH_CONFIG.y,
      z: LAUNCH_CONFIG.z,
    });
    expect(deriveFlightState(restarted)).toBe("airborne");
    expect(isLanded(restarted)).toBe(false);
  });

  it("full flight cycle: launch -> fly -> land", () => {
    let state = createLaunchState();
    expect(deriveFlightState(state)).toBe("airborne");

    // Simulate ~2 minutes of flight
    for (let i = 0; i < 7200; i++) {
      state = simulateStep(state, 1 / 60, ZERO_ENVIRONMENT);
      if (isLanded(state)) break;
    }

    expect(isLanded(state)).toBe(true);
    expect(deriveFlightState(state)).toBe("landed");
  });
});
