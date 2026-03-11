import { describe, it, expect } from "vitest";
import {
  airspeedToWindGain,
  LANDING_VOLUME,
  sinkToLandingDuration,
} from "@/modules/audio/params";
import { createVariometer } from "@/modules/audio/variometer";
import { createWindAudio } from "@/modules/audio/wind";

describe("audio params", () => {
  describe("airspeedToWindGain", () => {
    it("returns 0 at or below min speed", () => {
      expect(airspeedToWindGain(0)).toBe(0);
      expect(airspeedToWindGain(2)).toBe(0);
    });

    it("returns 0..1 for speed in range", () => {
      const mid = airspeedToWindGain(7);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThanOrEqual(1);
    });

    it("increases with speed", () => {
      expect(airspeedToWindGain(4)).toBeLessThan(airspeedToWindGain(8));
      expect(airspeedToWindGain(8)).toBeLessThan(airspeedToWindGain(12));
    });

    it("caps at 1 for high speed", () => {
      expect(airspeedToWindGain(12)).toBeLessThanOrEqual(1);
      expect(airspeedToWindGain(20)).toBeLessThanOrEqual(1);
    });
  });

  describe("LANDING_VOLUME", () => {
    it("has entries for all landing qualities", () => {
      expect(LANDING_VOLUME.smooth).toBeDefined();
      expect(LANDING_VOLUME.hard).toBeDefined();
      expect(LANDING_VOLUME.rough).toBeDefined();
    });

    it("rough is louder than smooth", () => {
      expect(LANDING_VOLUME.rough).toBeGreaterThan(LANDING_VOLUME.smooth);
    });
  });

  describe("sinkToLandingDuration", () => {
    it("returns duration in reasonable range", () => {
      expect(sinkToLandingDuration(0.5)).toBeGreaterThanOrEqual(0.05);
      expect(sinkToLandingDuration(0.5)).toBeLessThanOrEqual(0.15);
    });

    it("higher sink gives longer duration", () => {
      expect(sinkToLandingDuration(1)).toBeLessThan(sinkToLandingDuration(3));
    });
  });
});

describe("audio setConfig", () => {
  it("vario has setConfig and accepts config update", () => {
    const vario = createVariometer({ enabled: true });
    expect(vario.setConfig).toBeDefined();
    expect(() => vario.setConfig({ enabled: false })).not.toThrow();
  });

  it("wind has setConfig and accepts config update", () => {
    const wind = createWindAudio({ enabled: true });
    expect(wind.setConfig).toBeDefined();
    expect(() => wind.setConfig({ enabled: false })).not.toThrow();
  });
});
