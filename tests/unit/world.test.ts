import { describe, it, expect } from "vitest";
import {
  isInLandingZone,
  LANDING_ZONE_RADIUS,
  LAUNCH_CONFIG,
} from "@/modules/world/config";

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
