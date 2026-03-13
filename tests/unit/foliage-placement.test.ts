import { describe, it, expect } from "vitest";
import { canPlaceTree, getTerrainBiome } from "@/modules/world/terrain";

describe("foliage placement", () => {
  it("allows trees in valley grass zones", () => {
    expect(canPlaceTree(90, 225)).toBe(true);
    expect(canPlaceTree(120, 225)).toBe(true);
  });

  it("disallows trees on mountain peak", () => {
    expect(canPlaceTree(0, 0)).toBe(false);
  });

  it("disallows trees in rock biome", () => {
    const biome = getTerrainBiome(0, 0);
    expect(["rock", "scree", "earth"]).toContain(biome);
    expect(canPlaceTree(0, 0)).toBe(false);
  });

  it("valley has grass biome for tree placement", () => {
    expect(getTerrainBiome(90, 225)).toBe("grass");
  });
});
