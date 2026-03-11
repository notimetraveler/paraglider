import { describe, it, expect } from "vitest";
import {
  computeScoreSummary,
  formatAirtime,
  formatDistance,
  type SessionStats,
} from "@/modules/scoring";

describe("scoring", () => {
  describe("computeScoreSummary", () => {
    it("maps session stats to score summary", () => {
      const stats: SessionStats = {
        airtimeSeconds: 125,
        maxAltitude: 180,
        distanceFromLaunch: 450,
      };
      const summary = computeScoreSummary(stats);
      expect(summary.airtime).toBe(125);
      expect(summary.maxAltitude).toBe(180);
      expect(summary.distance).toBe(450);
    });
  });

  describe("formatAirtime", () => {
    it("formats seconds as mm:ss", () => {
      expect(formatAirtime(0)).toBe("0:00");
      expect(formatAirtime(65)).toBe("1:05");
      expect(formatAirtime(125)).toBe("2:05");
      expect(formatAirtime(3661)).toBe("61:01");
    });
  });

  describe("formatDistance", () => {
    it("formats meters", () => {
      expect(formatDistance(0)).toBe("0 m");
      expect(formatDistance(123.7)).toBe("124 m");
    });
  });
});
