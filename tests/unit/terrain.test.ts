import { describe, it, expect } from "vitest";
import {
  getMountainTerrainHeight,
  getTerrainSlope,
  getTerrainBiome,
  canPlaceTree,
  FLAT_GROUND_LEVEL,
} from "@/modules/world/terrain";

describe("terrain", () => {
  it("peak is highest near origin", () => {
    const atPeak = getMountainTerrainHeight(0, 0);
    const away = getMountainTerrainHeight(200, 200);
    expect(atPeak).toBeGreaterThan(away);
    expect(atPeak).toBeGreaterThan(100);
  });

  it("valley floor is low and positive", () => {
    const valley = getMountainTerrainHeight(300, 400);
    expect(valley).toBeGreaterThan(0);
    expect(valley).toBeLessThan(60);
  });

  it("FLAT_GROUND_LEVEL is 0", () => {
    expect(FLAT_GROUND_LEVEL).toBe(0);
  });

  describe("getTerrainSlope", () => {
    it("returns low slope in valley", () => {
      expect(getTerrainSlope(150, 220)).toBeLessThan(0.2);
    });
    it("returns higher slope near peak", () => {
      expect(getTerrainSlope(0, 0)).toBeGreaterThan(0);
    });
  });

  describe("getTerrainBiome", () => {
    it("returns grass in valley", () => {
      expect(getTerrainBiome(150, 220)).toBe("grass");
    });
    it("returns rock or scree on steep slopes", () => {
      const b = getTerrainBiome(0, 0);
      expect(["rock", "scree", "earth"]).toContain(b);
    });
  });

  describe("canPlaceTree", () => {
    it("allows trees in valley grass", () => {
      expect(canPlaceTree(150, 220)).toBe(true);
    });
    it("disallows trees on steep peak", () => {
      expect(canPlaceTree(0, 0)).toBe(false);
    });
  });
});
