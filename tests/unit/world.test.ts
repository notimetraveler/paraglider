import { describe, it, expect } from "vitest";
import {
  isInLandingZone,
  LANDING_ZONE_RADIUS,
  LAUNCH_CONFIG,
  DEFAULT_THERMALS,
  DEFAULT_RIDGE,
  DEFAULT_WIND,
} from "@/modules/world/config";

describe("world layout", () => {
  it("ridge is downwind of launch (wind pushes toward ridge)", () => {
    expect(DEFAULT_WIND.x).toBeGreaterThan(0);
    expect(DEFAULT_RIDGE.x1).toBeGreaterThan(LAUNCH_CONFIG.x);
  });

  it("starter thermal is near launch for first minutes", () => {
    const starter = DEFAULT_THERMALS[0];
    const dist = Math.sqrt(
      (starter.x - LAUNCH_CONFIG.x) ** 2 + (starter.z - LAUNCH_CONFIG.z) ** 2
    );
    expect(dist).toBeLessThan(80);
  });

  it("thermal strengths are balanced (sink still matters)", () => {
    for (const t of DEFAULT_THERMALS) {
      expect(t.strength).toBeGreaterThan(1);
      expect(t.strength).toBeLessThan(4);
    }
  });
});

describe("landing zone", () => {
  it("returns true when inside radius", () => {
    expect(isInLandingZone(LAUNCH_CONFIG.x, LAUNCH_CONFIG.z)).toBe(true);
    expect(isInLandingZone(LAUNCH_CONFIG.x + 30, LAUNCH_CONFIG.z)).toBe(true);
    expect(isInLandingZone(LAUNCH_CONFIG.x, LAUNCH_CONFIG.z + LANDING_ZONE_RADIUS - 1)).toBe(true);
  });

  it("returns false when outside radius", () => {
    expect(isInLandingZone(LAUNCH_CONFIG.x + LANDING_ZONE_RADIUS + 1, LAUNCH_CONFIG.z)).toBe(false);
    expect(isInLandingZone(LAUNCH_CONFIG.x + 100, LAUNCH_CONFIG.z + 100)).toBe(false);
  });

  it("returns true on boundary", () => {
    expect(isInLandingZone(LAUNCH_CONFIG.x + LANDING_ZONE_RADIUS, LAUNCH_CONFIG.z)).toBe(true);
  });
});
