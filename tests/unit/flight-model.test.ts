import { describe, it, expect } from "vitest";
import { simulateStep } from "@/modules/flight-model/simulate";
import {
  createInitialAircraftState,
  type AircraftState,
} from "@/modules/flight-model/state";

function createInitialState(overrides?: Partial<AircraftState>): AircraftState {
  return createInitialAircraftState({
    position: { x: 0, y: 100, z: 0 },
    ...overrides,
  });
}

describe("flight model", () => {
  describe("simulateStep", () => {
    it("sink rate - y position decreases when airborne", () => {
      const state = createInitialState();
      const next = simulateStep(state);
      expect(next.position.y).toBeLessThan(state.position.y);
    });
    it("sink rate at trim is ~1.3 m/s (paraglider-typical)", () => {
      const state = createInitialState({ velocity: { x: 0, y: 0, z: 0 } });
      let s = state;
      for (let i = 0; i < 120; i++) s = simulateStep(s);
      expect(Math.abs(s.velocity.y) - 1.3).toBeLessThan(0.2);
    });
    it("advances position in heading direction", () => {
      const state = createInitialState();
      const next = simulateStep(state);
      expect(next.position.z).not.toBe(state.position.z);
    });
    it("steerLeft increases heading (turn left)", () => {
      const state = createInitialState({
        inputs: { steerLeft: 1, steerRight: 0, brake: 0, acceleratedFlight: 0 },
      });
      const next = simulateStep(state);
      expect(next.heading).toBeGreaterThan(state.heading);
    });
    it("steerRight decreases heading (turn right)", () => {
      const state = createInitialState({
        inputs: { steerLeft: 0, steerRight: 1, brake: 0, acceleratedFlight: 0 },
      });
      const next = simulateStep(state);
      expect(next.heading).toBeLessThan(state.heading);
    });
    it("steerLeft produces positive bank (left wing down)", () => {
      const state = createInitialState({
        inputs: { steerLeft: 1, steerRight: 0, brake: 0, acceleratedFlight: 0 },
      });
      const next = simulateStep(state);
      expect(next.bank).toBeGreaterThan(0);
    });
    it("steerRight produces negative bank (right wing down)", () => {
      const state = createInitialState({
        inputs: { steerLeft: 0, steerRight: 1, brake: 0, acceleratedFlight: 0 },
      });
      const next = simulateStep(state);
      expect(next.bank).toBeLessThan(0);
    });
    it("bank decays toward level when steer input is released", () => {
      let state = createInitialState({
        bank: (25 * Math.PI) / 180,
        inputs: { steerLeft: 0, steerRight: 0, brake: 0, acceleratedFlight: 0 },
      });
      for (let i = 0; i < 90; i++) {
        state = simulateStep(state);
      }
      expect(Math.abs(state.bank)).toBeLessThan(0.05);
    });
    it("coordinated turn: constant bank produces smooth circular path", () => {
      const bankAngle = (35 * Math.PI) / 180;
      const inputs = { steerLeft: 1, steerRight: 0, brake: 0, acceleratedFlight: 0 };
      let state = createInitialState({
        position: { x: 0, y: 100, z: 0 },
        velocity: { x: 0, y: -1.3, z: 8 },
        bank: bankAngle,
        inputs,
      });
      const startX = state.position.x;
      const startZ = state.position.z;
      const dt = 1 / 60;
      const turnRate = (9.81 * Math.tan(bankAngle)) / 8;
      const circleTime = (2 * Math.PI) / turnRate;
      const steps = Math.ceil(circleTime / dt);
      for (let i = 0; i < steps; i++) {
        state = simulateStep(state, dt);
      }
      const dist = Math.sqrt((state.position.x - startX) ** 2 + (state.position.z - startZ) ** 2);
      expect(dist).toBeLessThan(20);
    });
    it("is deterministic for same inputs", () => {
      const state = createInitialState();
      const a = simulateStep(state);
      const b = simulateStep(state);
      expect(a.position.x).toBe(b.position.x);
      expect(a.position.y).toBe(b.position.y);
      expect(a.position.z).toBe(b.position.z);
    });
    it("brake reduces airspeed", () => {
      const state = createInitialState({
        inputs: { steerLeft: 0, steerRight: 0, brake: 1, acceleratedFlight: 0 },
      });
      const next = simulateStep(state);
      expect(next.airspeed).toBeLessThan(state.airspeed);
    });
    it("acceleratedFlight increases airspeed", () => {
      const state = createInitialState({
        inputs: { steerLeft: 0, steerRight: 0, brake: 0, acceleratedFlight: 1 },
      });
      const next = simulateStep(state);
      expect(next.airspeed).toBeGreaterThan(state.airspeed);
    });
    it("ground collision prevents falling through", () => {
      const state = createInitialState({
        position: { x: 0, y: 0.02, z: 0 },
        velocity: { x: 0, y: -2, z: 0 },
      });
      const next = simulateStep(state);
      expect(next.position.y).toBe(0);
      expect(next.velocity.y).toBe(0);
    });
    it("landing stops completely - no sliding", () => {
      const state = createInitialState({
        position: { x: 10, y: 0.02, z: 20 },
        velocity: { x: 5, y: -2, z: 8 },
      });
      const next = simulateStep(state);
      expect(next.position.y).toBe(0);
      expect(next.velocity.x).toBe(0);
      expect(next.velocity.y).toBe(0);
      expect(next.velocity.z).toBe(0);
      expect(next.position.x).toBe(10);
      expect(next.position.z).toBe(20);
    });
  });
});
