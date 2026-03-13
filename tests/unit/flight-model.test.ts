import { describe, it, expect } from "vitest";
import { simulateStep } from "@/modules/flight-model/simulate";
import {
  createInitialAircraftState,
  type AircraftState,
} from "@/modules/flight-model/state";
import { ZERO_ENVIRONMENT } from "@/modules/world/config";

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
    it("sink rate at trim is ~1.25 m/s (paraglider-typical)", () => {
      const state = createInitialState({ velocity: { x: 0, y: 0, z: 0 } });
      let s = state;
      for (let i = 0; i < 120; i++) s = simulateStep(s);
      expect(Math.abs(s.velocity.y) - 1.25).toBeLessThan(0.2);
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
      for (let i = 0; i < 120; i++) {
        state = simulateStep(state);
      }
      expect(Math.abs(state.bank)).toBeLessThan(0.06);
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
        state = simulateStep(state, dt, ZERO_ENVIRONMENT);
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
      const next = simulateStep(state, 1 / 60, ZERO_ENVIRONMENT);
      expect(next.position.y).toBe(0);
      expect(next.velocity.y).toBe(0);
    });
    it("stops at the first terrain hit instead of tunneling through a rising slope", () => {
      const wallEnv = {
        ...ZERO_ENVIRONMENT,
        getGroundHeight: (_x: number, z: number) => (z < 1 ? 0 : 20),
      };
      const state = createInitialState({
        position: { x: 0, y: 10, z: 0 },
        velocity: { x: 0, y: -1.25, z: 8 },
      });
      const next = simulateStep(state, 1, wallEnv);
      expect(next.velocity.x).toBe(0);
      expect(next.velocity.y).toBe(0);
      expect(next.velocity.z).toBe(0);
      expect(next.position.z).toBeLessThan(2);
      expect(next.position.y).toBeCloseTo(20, 2);
    });
    it("landing stops completely - no sliding", () => {
      const state = createInitialState({
        position: { x: 10, y: 0.02, z: 20 },
        velocity: { x: 5, y: -2, z: 8 },
      });
      const next = simulateStep(state, 1 / 60, ZERO_ENVIRONMENT);
      const settled = simulateStep(next, 1 / 60, ZERO_ENVIRONMENT);
      expect(next.position.y).toBe(0);
      expect(next.velocity.x).toBe(0);
      expect(next.velocity.y).toBe(0);
      expect(next.velocity.z).toBe(0);
      expect(settled.position.x).toBe(next.position.x);
      expect(settled.position.y).toBe(next.position.y);
      expect(settled.position.z).toBe(next.position.z);
    });
    it("brake reduces sink rate", () => {
      const trim = createInitialState({
        velocity: { x: 0, y: -1.25, z: 8 },
        inputs: { steerLeft: 0, steerRight: 0, brake: 0, acceleratedFlight: 0 },
      });
      const braked = createInitialState({
        velocity: { x: 0, y: -1.25, z: 8 },
        inputs: { steerLeft: 0, steerRight: 0, brake: 1, acceleratedFlight: 0 },
      });
      let sTrim = trim;
      let sBraked = braked;
      for (let i = 0; i < 60; i++) {
        sTrim = simulateStep(sTrim, 1 / 60, ZERO_ENVIRONMENT);
        sBraked = simulateStep(sBraked, 1 / 60, ZERO_ENVIRONMENT);
      }
      expect(sBraked.verticalSpeed).toBeGreaterThan(sTrim.verticalSpeed);
    });
    it("accelerated flight increases sink rate", () => {
      const trim = createInitialState({
        velocity: { x: 0, y: -1.25, z: 8 },
        inputs: { steerLeft: 0, steerRight: 0, brake: 0, acceleratedFlight: 0 },
      });
      const accel = createInitialState({
        velocity: { x: 0, y: -1.25, z: 8 },
        inputs: { steerLeft: 0, steerRight: 0, brake: 0, acceleratedFlight: 1 },
      });
      let sTrim = trim;
      let sAccel = accel;
      for (let i = 0; i < 60; i++) {
        sTrim = simulateStep(sTrim, 1 / 60, ZERO_ENVIRONMENT);
        sAccel = simulateStep(sAccel, 1 / 60, ZERO_ENVIRONMENT);
      }
      expect(sAccel.verticalSpeed).toBeLessThan(sTrim.verticalSpeed);
    });
    it("turn increases sink (bank energy loss)", () => {
      const straight = createInitialState({
        velocity: { x: 0, y: -1.25, z: 8 },
        inputs: { steerLeft: 0, steerRight: 0, brake: 0, acceleratedFlight: 0 },
      });
      const turning = createInitialState({
        velocity: { x: 0, y: -1.25, z: 8 },
        inputs: { steerLeft: 1, steerRight: 0, brake: 0, acceleratedFlight: 0 },
      });
      let sStraight = straight;
      let sTurning = turning;
      for (let i = 0; i < 90; i++) {
        sStraight = simulateStep(sStraight, 1 / 60, ZERO_ENVIRONMENT);
        sTurning = simulateStep(sTurning, 1 / 60, ZERO_ENVIRONMENT);
      }
      expect(sTurning.position.y).toBeLessThan(sStraight.position.y);
    });
    it("touchdownSink captured on ground collision", () => {
      const state = createInitialState({
        position: { x: 0, y: 0.01, z: 0 },
        velocity: { x: 0, y: -2.5, z: 6 },
        inputs: { steerLeft: 0, steerRight: 0, brake: 0, acceleratedFlight: 0 },
      });
      const next = simulateStep(state, 1 / 60, ZERO_ENVIRONMENT);
      expect(next.position.y).toBe(0);
      expect(next.touchdownSink).toBeDefined();
      expect(next.touchdownSink).toBeGreaterThanOrEqual(0);
    });
    it("flare reduces sink when near ground with brake", () => {
      const noFlare = createInitialState({
        position: { x: 0, y: 2, z: 0 },
        velocity: { x: 0, y: -1.2, z: 7 },
        inputs: { steerLeft: 0, steerRight: 0, brake: 0, acceleratedFlight: 0 },
      });
      const flaring = createInitialState({
        position: { x: 0, y: 2, z: 0 },
        velocity: { x: 0, y: -1.2, z: 7 },
        inputs: { steerLeft: 0, steerRight: 0, brake: 0.8, acceleratedFlight: 0 },
      });
      let sNo = noFlare;
      let sFlare = flaring;
      for (let i = 0; i < 30; i++) {
        sNo = simulateStep(sNo, 1 / 60, ZERO_ENVIRONMENT);
        sFlare = simulateStep(sFlare, 1 / 60, ZERO_ENVIRONMENT);
      }
      expect(sFlare.verticalSpeed).toBeGreaterThan(sNo.verticalSpeed);
    });
  });
});
