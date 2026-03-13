import { describe, it, expect } from "vitest";
import {
  isDownwindLanding,
  isIntoWindLanding,
  classifyLandingType,
  getBaseScoreForLandingType,
  LANDING_TYPE_BASE_SCORE,
} from "@/modules/scoring/landing-type";

describe("landing type", () => {
  describe("isDownwindLanding", () => {
    it("returns true when heading aligns with wind direction (flying with wind)", () => {
      const wind = { x: 5, z: 0 };
      const heading = Math.PI / 2;
      expect(isDownwindLanding(heading, wind)).toBe(true);
    });

    it("returns false when heading opposes wind (into wind)", () => {
      const wind = { x: 5, z: 0 };
      const heading = -Math.PI / 2;
      expect(isDownwindLanding(heading, wind)).toBe(false);
    });

    it("returns false for zero wind", () => {
      expect(isDownwindLanding(0, { x: 0, z: 0 })).toBe(false);
    });

    it("north wind (0,5): heading north (0) is downwind", () => {
      expect(isDownwindLanding(0, { x: 0, z: 5 })).toBe(true);
    });

    it("north wind (0,5): heading south (π) is into wind", () => {
      expect(isDownwindLanding(Math.PI, { x: 0, z: 5 })).toBe(false);
    });
  });

  describe("isIntoWindLanding", () => {
    it("is opposite of isDownwindLanding", () => {
      const wind = { x: 3, z: 2 };
      expect(isIntoWindLanding(0, wind)).toBe(!isDownwindLanding(0, wind));
      expect(isIntoWindLanding(Math.PI / 2, wind)).toBe(
        !isDownwindLanding(Math.PI / 2, wind)
      );
    });
  });

  describe("classifyLandingType", () => {
    it("returns downwind when flying with wind", () => {
      const wind = { x: 5, z: 0 };
      expect(classifyLandingType(wind, Math.PI / 2, false)).toBe("downwind");
      expect(classifyLandingType(wind, Math.PI / 2, true)).toBe("downwind");
    });

    it("returns into_wind_flare when into wind and had flare", () => {
      const wind = { x: 5, z: 0 };
      expect(classifyLandingType(wind, -Math.PI / 2, true)).toBe(
        "into_wind_flare"
      );
    });

    it("returns into_wind_no_flare when into wind and no flare", () => {
      const wind = { x: 5, z: 0 };
      expect(classifyLandingType(wind, -Math.PI / 2, false)).toBe(
        "into_wind_no_flare"
      );
    });
  });

  describe("getBaseScoreForLandingType", () => {
    it("returns 25 for downwind", () => {
      expect(getBaseScoreForLandingType("downwind")).toBe(25);
    });
    it("returns 50 for into_wind_no_flare", () => {
      expect(getBaseScoreForLandingType("into_wind_no_flare")).toBe(50);
    });
    it("returns 100 for into_wind_flare", () => {
      expect(getBaseScoreForLandingType("into_wind_flare")).toBe(100);
    });
    it("returns 0 for crash", () => {
      expect(getBaseScoreForLandingType("crash")).toBe(0);
    });
  });

  describe("LANDING_TYPE_BASE_SCORE", () => {
    it("matches getBaseScoreForLandingType for all types", () => {
      expect(LANDING_TYPE_BASE_SCORE.downwind).toBe(25);
      expect(LANDING_TYPE_BASE_SCORE.into_wind_no_flare).toBe(50);
      expect(LANDING_TYPE_BASE_SCORE.into_wind_flare).toBe(100);
      expect(LANDING_TYPE_BASE_SCORE.crash).toBe(0);
    });
  });
});
