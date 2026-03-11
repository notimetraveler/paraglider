import { describe, it, expect } from "vitest";
import { simulateStep } from "@/modules/flight-model/simulate";
import {
  createInitialAircraftState,
  createLaunchState,
} from "@/modules/flight-model/state";
import { getThermalLift } from "@/modules/world/lift";
import {
  DEFAULT_ENVIRONMENT,
  DEFAULT_THERMALS,
} from "@/modules/world/config";
import type { Environment } from "@/modules/world/types";

describe("wind influence", () => {
  it("wind drifts ground track", () => {
    const noWind: Environment = {
      wind: { x: 0, z: 0 },
      thermals: [],
    };
    const withWind: Environment = {
      wind: { x: 5, z: 0 },
      thermals: [],
    };

    let stateNoWind = createInitialAircraftState({
      position: { x: 0, y: 100, z: 0 },
      heading: 0,
    });
    let stateWithWind = createInitialAircraftState({
      position: { x: 0, y: 100, z: 0 },
      heading: 0,
    });

    for (let i = 0; i < 60; i++) {
      stateNoWind = simulateStep(stateNoWind, 1 / 60, noWind);
      stateWithWind = simulateStep(stateWithWind, 1 / 60, withWind);
    }

    expect(stateWithWind.position.x).toBeGreaterThan(stateNoWind.position.x);
  });

  it("wind from west pushes aircraft eastward when flying north", () => {
    const windEast: Environment = {
      wind: { x: 3, z: 0 },
      thermals: [],
    };
    const state = createInitialAircraftState({
      position: { x: 0, y: 100, z: 0 },
      heading: 0,
    });
    const next = simulateStep(state, 1 / 60, windEast);
    expect(next.position.x).toBeGreaterThan(0);
  });

  it("is deterministic for same wind", () => {
    const state = createLaunchState();
    const a = simulateStep(state, 1 / 60, DEFAULT_ENVIRONMENT);
    const b = simulateStep(state, 1 / 60, DEFAULT_ENVIRONMENT);
    expect(a.position.x).toBe(b.position.x);
    expect(a.position.y).toBe(b.position.y);
    expect(a.position.z).toBe(b.position.z);
  });
});

describe("thermal lift", () => {
  it("getThermalLift returns 0 outside thermal", () => {
    const [t] = DEFAULT_THERMALS;
    const lift = getThermalLift(t.x + t.radius + 10, t.z, DEFAULT_THERMALS);
    expect(lift).toBe(0);
  });

  it("getThermalLift returns strength at center", () => {
    const [t] = DEFAULT_THERMALS;
    const lift = getThermalLift(t.x, t.z, [t]);
    expect(lift).toBe(t.strength);
  });

  it("getThermalLift has radial falloff", () => {
    const t = { x: 0, z: 0, radius: 100, strength: 2 };
    const center = getThermalLift(0, 0, [t]);
    const edge = getThermalLift(99, 0, [t]);
    const outside = getThermalLift(101, 0, [t]);
    expect(center).toBe(2);
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(center);
    expect(outside).toBe(0);
  });

  it("thermal enables climb", () => {
    const noLift: Environment = { wind: { x: 0, z: 0 }, thermals: [] };
    const strongThermal: Environment = {
      wind: { x: 0, z: 0 },
      thermals: [{ x: 0, z: 0, radius: 200, strength: 5 }],
    };

    let stateNoLift = createInitialAircraftState({
      position: { x: 0, y: 50, z: 0 },
    });
    let stateLift = createInitialAircraftState({
      position: { x: 0, y: 50, z: 0 },
    });

    for (let i = 0; i < 120; i++) {
      stateNoLift = simulateStep(stateNoLift, 1 / 60, noLift);
      stateLift = simulateStep(stateLift, 1 / 60, strongThermal);
    }

    expect(stateLift.position.y).toBeGreaterThan(stateNoLift.position.y);
  });

  it("is deterministic for same position", () => {
    const lift1 = getThermalLift(150, 200, DEFAULT_THERMALS);
    const lift2 = getThermalLift(150, 200, DEFAULT_THERMALS);
    expect(lift1).toBe(lift2);
  });
});
