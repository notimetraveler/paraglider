import { describe, it, expect } from "vitest";
import {
  computeScoreSummary,
  computeWindsockProximityPoints,
  computeFinalScore,
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

  describe("computeWindsockProximityPoints", () => {
    it("returns 100 at 0 m", () => {
      expect(computeWindsockProximityPoints(0)).toBe(100);
    });
    it("returns 50 at 100 m (−1% per 2 m)", () => {
      expect(computeWindsockProximityPoints(100)).toBe(50);
    });
    it("returns 0 at 200 m and stays 0 beyond", () => {
      expect(computeWindsockProximityPoints(200)).toBe(0);
      expect(computeWindsockProximityPoints(250)).toBe(0);
    });
    it("decreases by 1 pt per 2 m", () => {
      expect(computeWindsockProximityPoints(2)).toBe(99);
      expect(computeWindsockProximityPoints(4)).toBe(98);
      expect(computeWindsockProximityPoints(50)).toBe(75);
    });
  });

  describe("computeFinalScore", () => {
    it("baseScore + 100 at 0 m", () => {
      expect(computeFinalScore(100, 0)).toBe(200);
    });
    it("baseScore + 50 at 100 m", () => {
      expect(computeFinalScore(100, 100)).toBe(150);
    });
    it("baseScore + 0 at 200 m", () => {
      expect(computeFinalScore(25, 200)).toBe(25);
    });
  });
});
