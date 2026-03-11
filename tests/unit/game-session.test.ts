import { describe, it, expect } from "vitest";
import {
  deriveFlightState,
  isLanded,
  didJustLand,
  classifyLandingQuality,
} from "@/modules/game-session/session";
import {
  createInitialAircraftState,
  createLaunchState,
  simulateStep,
} from "@/modules/flight-model";
import { GROUND_LEVEL, ZERO_ENVIRONMENT } from "@/modules/world/config";

describe("game session", () => {
  describe("isLanded", () => {
    it("returns false when airborne", () => {
      const state = createLaunchState();
      expect(isLanded(state)).toBe(false);
    });

    it("returns true when on ground with zero speed", () => {
      const state = createInitialAircraftState({
        position: { x: 0, y: GROUND_LEVEL, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        airspeed: 0,
        verticalSpeed: 0,
      });
      expect(isLanded(state)).toBe(true);
    });

    it("returns false when on ground but still moving", () => {
      const state = createInitialAircraftState({
        position: { x: 0, y: GROUND_LEVEL, z: 0 },
        velocity: { x: 5, y: 0, z: 8 },
        airspeed: 9,
      });
      expect(isLanded(state)).toBe(false);
    });

    it("returns true when just above ground with negligible speed", () => {
      const state = createInitialAircraftState({
        position: { x: 0, y: GROUND_LEVEL + 0.3, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        airspeed: 0.2,
      });
      expect(isLanded(state)).toBe(true);
    });
  });

  describe("deriveFlightState", () => {
    it("returns airborne when flying", () => {
      const state = createLaunchState();
      expect(deriveFlightState(state)).toBe("airborne");
    });

    it("returns landed when on ground and stopped", () => {
      const state = createInitialAircraftState({
        position: { x: 0, y: GROUND_LEVEL, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        airspeed: 0,
      });
      expect(deriveFlightState(state)).toBe("landed");
    });
  });

  describe("didJustLand", () => {
    it("returns true when transitioning from airborne to landed", () => {
      const prev = createLaunchState();
      const next = createInitialAircraftState({
        position: { x: 10, y: GROUND_LEVEL, z: 20 },
        velocity: { x: 0, y: 0, z: 0 },
        airspeed: 0,
      });
      expect(didJustLand(prev, next)).toBe(true);
    });

    it("returns false when both airborne", () => {
      const prev = createLaunchState();
      const next = simulateStep(prev);
      expect(didJustLand(prev, next)).toBe(false);
    });

    it("returns false when both landed", () => {
      const landed = createInitialAircraftState({
        position: { x: 0, y: GROUND_LEVEL, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        airspeed: 0,
      });
      expect(didJustLand(landed, landed)).toBe(false);
    });
  });

  describe("classifyLandingQuality", () => {
    it("returns smooth for sink < 1.0 m/s", () => {
      expect(classifyLandingQuality(0.5)).toBe("smooth");
      expect(classifyLandingQuality(0.99)).toBe("smooth");
    });
    it("returns hard for sink 1.0–2.5 m/s", () => {
      expect(classifyLandingQuality(1.0)).toBe("hard");
      expect(classifyLandingQuality(1.5)).toBe("hard");
      expect(classifyLandingQuality(2.5)).toBe("hard");
    });
    it("returns rough for sink > 2.5 m/s", () => {
      expect(classifyLandingQuality(2.6)).toBe("rough");
      expect(classifyLandingQuality(4)).toBe("rough");
    });
  });

  describe("state transitions", () => {
    it("aircraft lands after descending to ground", () => {
      let state = createInitialAircraftState({
        position: { x: 0, y: 2, z: 0 },
        velocity: { x: 0, y: -2, z: 8 },
        airspeed: 8,
      });
      for (let i = 0; i < 120; i++) {
        state = simulateStep(state, 1 / 60, ZERO_ENVIRONMENT);
      }
      expect(isLanded(state)).toBe(true);
      expect(state.position.y).toBe(GROUND_LEVEL);
      expect(state.velocity.x).toBe(0);
      expect(state.velocity.z).toBe(0);
    });

    it("touchdownSink is set when landing", () => {
      let state = createInitialAircraftState({
        position: { x: 0, y: 2, z: 0 },
        velocity: { x: 0, y: -1.5, z: 6 },
        airspeed: 6,
      });
      let next = state;
      for (let i = 0; i < 120; i++) {
        next = simulateStep(state, 1 / 60, ZERO_ENVIRONMENT);
        if (isLanded(next)) break;
        state = next;
      }
      expect(isLanded(next)).toBe(true);
      expect(next.touchdownSink).toBeDefined();
      expect(next.touchdownSink).toBeGreaterThan(0);
    });
  });
});
