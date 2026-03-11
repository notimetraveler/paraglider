import { describe, it, expect } from "vitest";
import { simulateStep } from "@/modules/flight-model/simulate";
import {
  createInitialAircraftState,
  createLaunchState,
} from "@/modules/flight-model/state";
import { getThermalLift, getRidgeLift } from "@/modules/world/lift";
import {
  DEFAULT_ENVIRONMENT,
  DEFAULT_THERMALS,
  DEFAULT_RIDGE,
} from "@/modules/world/config";
import type { Environment } from "@/modules/world/types";

describe("wind influence", () => {
  it("wind drifts ground track", () => {
    const noWind: Environment = {
      wind: { x: 0, z: 0 },
      thermals: [],
      ridgeLift: [],
    };
    const withWind: Environment = {
      wind: { x: 5, z: 0 },
      thermals: [],
      ridgeLift: [],
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
      ridgeLift: [],
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
  it("getThermalLift returns 0 outside thermal (beyond soft edge)", () => {
    const [t] = DEFAULT_THERMALS;
    const beyondSoftEdge = t.radius * 1.2;
    const lift = getThermalLift(t.x + beyondSoftEdge, t.z, [t]);
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
    const outside = getThermalLift(120, 0, [t]);
    expect(center).toBe(2);
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(center);
    expect(outside).toBe(0);
  });

  it("thermal enables climb", () => {
    const noLift: Environment = {
      wind: { x: 0, z: 0 },
      thermals: [],
      ridgeLift: [],
    };
    const strongThermal: Environment = {
      wind: { x: 0, z: 0 },
      thermals: [{ x: 0, z: 0, radius: 200, strength: 5 }],
      ridgeLift: [],
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

  it("soft edge gives lift just outside radius", () => {
    const t = { x: 0, z: 0, radius: 100, strength: 2 };
    const atEdge = getThermalLift(100, 0, [t]);
    const outsideSoft = getThermalLift(108, 0, [t]);
    const farOutside = getThermalLift(120, 0, [t]);
    expect(atEdge).toBeGreaterThan(0);
    expect(outsideSoft).toBeGreaterThan(0);
    expect(farOutside).toBe(0);
  });
});

describe("ridge lift", () => {
  it("returns 0 with no wind", () => {
    const lift = getRidgeLift(
      DEFAULT_RIDGE.x1,
      (DEFAULT_RIDGE.z1 + DEFAULT_RIDGE.z2) / 2,
      [DEFAULT_RIDGE],
      { x: 0, z: 0 }
    );
    expect(lift).toBe(0);
  });

  it("returns 0 when wind parallel to ridge", () => {
    const ridge = { ...DEFAULT_RIDGE, x1: 0, z1: 0, x2: 0, z2: 100 };
    const lift = getRidgeLift(0, 50, [ridge], { x: 0, z: 5 });
    expect(lift).toBe(0);
  });

  it("gives lift when wind perpendicular to ridge and near ridge", () => {
    const ridge = { x1: -50, z1: 50, x2: -50, z2: 200, width: 40, strength: 2 };
    const wind = { x: -5, z: 0 };
    const lift = getRidgeLift(-50, 100, [ridge], wind);
    expect(lift).toBeGreaterThan(0);
  });

  it("ridge lift enables climb with wind", () => {
    const ridgeEnv: Environment = {
      wind: { x: -5, z: 0 },
      thermals: [],
      ridgeLift: [
        { x1: -60, z1: 80, x2: -60, z2: 150, width: 50, strength: 2.5 },
      ],
    };
    const noLift: Environment = {
      wind: { x: 0, z: 0 },
      thermals: [],
      ridgeLift: [],
    };
    let stateRidge = createInitialAircraftState({
      position: { x: -60, y: 50, z: 100 },
    });
    let stateNoLift = createInitialAircraftState({
      position: { x: -60, y: 50, z: 100 },
    });
    for (let i = 0; i < 120; i++) {
      stateRidge = simulateStep(stateRidge, 1 / 60, ridgeEnv);
      stateNoLift = simulateStep(stateNoLift, 1 / 60, noLift);
    }
    expect(stateRidge.position.y).toBeGreaterThan(stateNoLift.position.y);
  });

  it("is deterministic for same position and wind", () => {
    const lift1 = getRidgeLift(-50, 200, [DEFAULT_RIDGE], DEFAULT_ENVIRONMENT.wind);
    const lift2 = getRidgeLift(-50, 200, [DEFAULT_RIDGE], DEFAULT_ENVIRONMENT.wind);
    expect(lift1).toBe(lift2);
  });
});
