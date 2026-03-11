import { describe, it, expect } from "vitest";
import {
  formatSpeed,
  formatAltitude,
  formatVerticalSpeed,
  formatHeading,
  formatHeadingCompass,
  formatWind,
  mapAircraftToHudData,
  mapInputsToDebug,
} from "@/modules/hud";
import { createInitialAircraftState } from "@/modules/flight-model";
import { ZERO_ENVIRONMENT } from "@/modules/world/config";

describe("hud format", () => {
  describe("formatSpeed", () => {
    it("formats airspeed with one decimal", () => {
      expect(formatSpeed(8)).toBe("8.0");
      expect(formatSpeed(12.34)).toBe("12.3");
      expect(formatSpeed(0)).toBe("0.0");
    });
  });

  describe("formatAltitude", () => {
    it("formats altitude as integer", () => {
      expect(formatAltitude(150)).toBe("150");
      expect(formatAltitude(99.4)).toBe("99");
      expect(formatAltitude(99.6)).toBe("100");
    });
  });

  describe("formatVerticalSpeed", () => {
    it("formats climb with plus sign", () => {
      expect(formatVerticalSpeed(1.5)).toBe("+1.5");
      expect(formatVerticalSpeed(0)).toBe("+0.0");
    });
    it("formats sink without plus sign", () => {
      expect(formatVerticalSpeed(-1.3)).toBe("-1.3");
    });
  });

  describe("formatHeading", () => {
    it("formats heading as degrees 0-359", () => {
      expect(formatHeading(0)).toBe("0");
      expect(formatHeading(Math.PI / 2)).toBe("90");
      expect(formatHeading(Math.PI)).toBe("180");
      expect(formatHeading((3 * Math.PI) / 2)).toBe("270");
    });
    it("wraps negative heading to positive", () => {
      expect(formatHeading(-Math.PI / 2)).toBe("270");
    });
  });

  describe("formatWind", () => {
    it("returns calm for zero wind", () => {
      expect(formatWind(0, 0)).toBe("calm");
    });
    it("returns speed and direction (wind FROM) for non-zero wind", () => {
      expect(formatWind(0, 3)).toMatch(/3\.0 m\/s S/);
      expect(formatWind(3, 0)).toMatch(/3\.0 m\/s W/);
    });
  });

  describe("formatHeadingCompass", () => {
    it("returns cardinal labels for exact directions", () => {
      expect(formatHeadingCompass(0)).toBe("N");
      expect(formatHeadingCompass(Math.PI / 2)).toBe("E");
      expect(formatHeadingCompass(Math.PI)).toBe("S");
      expect(formatHeadingCompass((3 * Math.PI) / 2)).toBe("W");
    });
    it("returns degrees for non-cardinal headings", () => {
      expect(formatHeadingCompass(Math.PI / 4)).toBe("45°");
      expect(formatHeadingCompass((3 * Math.PI) / 4)).toBe("135°");
    });
  });
});

describe("hud map", () => {
  describe("mapAircraftToHudData", () => {
    it("maps aircraft state to HUD data", () => {
      const state = createInitialAircraftState({
        position: { x: 10, y: 200, z: 5 },
        airspeed: 8.5,
        verticalSpeed: -1.2,
        heading: Math.PI / 4,
      });
      const hud = mapAircraftToHudData(state, ZERO_ENVIRONMENT);
      expect(hud.airspeed).toBe(8.5);
      expect(hud.altitude).toBe(200);
      expect(hud.verticalSpeed).toBe(-1.2);
      expect(hud.heading).toBe(Math.PI / 4);
      expect(hud.windX).toBe(0);
      expect(hud.windZ).toBe(0);
      expect(hud.thermalLift).toBe(0);
    });
    it("returns airborne when above ground", () => {
      const state = createInitialAircraftState({
        position: { x: 0, y: 100, z: 0 },
      });
      const hud = mapAircraftToHudData(state, ZERO_ENVIRONMENT);
      expect(hud.state).toBe("airborne");
    });
    it("returns landed when on ground with low speed", () => {
      const state = createInitialAircraftState({
        position: { x: 0, y: 0, z: 0 },
        airspeed: 0,
        velocity: { x: 0, y: 0, z: 0 },
      });
      const hud = mapAircraftToHudData(state, ZERO_ENVIRONMENT);
      expect(hud.state).toBe("landed");
    });
    it("includes distanceToLz when altitude 0–150 m", () => {
      const state = createInitialAircraftState({
        position: { x: 50, y: 80, z: 30 },
      });
      const hud = mapAircraftToHudData(state, ZERO_ENVIRONMENT);
      expect(hud.distanceToLz).toBeDefined();
      expect(hud.distanceToLz).toBeCloseTo(Math.sqrt(50 * 50 + 30 * 30), 0);
    });
    it("omits distanceToLz when altitude >= 150 m", () => {
      const state = createInitialAircraftState({
        position: { x: 50, y: 200, z: 30 },
      });
      const hud = mapAircraftToHudData(state, ZERO_ENVIRONMENT);
      expect(hud.distanceToLz).toBeUndefined();
    });
  });

  describe("mapInputsToDebug", () => {
    it("maps control inputs to debug display", () => {
      const inputs = {
        steerLeft: 0.5,
        steerRight: 0,
        brake: 0.3,
        acceleratedFlight: 0,
      };
      const debug = mapInputsToDebug(inputs);
      expect(debug.steerLeft).toBe(0.5);
      expect(debug.steerRight).toBe(0);
      expect(debug.brake).toBe(0.3);
      expect(debug.acceleratedFlight).toBe(0);
    });
  });
});
