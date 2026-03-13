import { describe, expect, it } from "vitest";
import {
  validateAtmosphereConfig,
  FOG_CONFIG,
  ATMOSPHERE_CONFIG,
} from "@/modules/rendering/atmosphere-config";

describe("atmosphere-config", () => {
  it("validates fog and color config without errors", () => {
    const { valid, errors } = validateAtmosphereConfig();
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  it("uses fog near less than far for depth", () => {
    expect(FOG_CONFIG.near).toBeLessThan(FOG_CONFIG.far);
  });

  it("exposes coherent atmosphere config", () => {
    expect(ATMOSPHERE_CONFIG.sky.zenith).toBeDefined();
    expect(ATMOSPHERE_CONFIG.sky.horizon).toBeDefined();
    expect(ATMOSPHERE_CONFIG.fog.color).toBeDefined();
    expect(ATMOSPHERE_CONFIG.hemisphere.intensity).toBeGreaterThan(0);
    expect(ATMOSPHERE_CONFIG.sun.intensity).toBeGreaterThan(0);
    expect(ATMOSPHERE_CONFIG.fill.intensity).toBeGreaterThan(0);
  });
});
