import { describe, expect, it } from "vitest";
import {
  getTerrainWorldSamplePosition,
  TERRAIN_MAX_Z,
  TERRAIN_MIN_X,
  TERRAIN_MIN_Z,
  TERRAIN_SEGMENTS,
} from "@/modules/rendering/terrain-mesh";

describe("terrain mesh sampling", () => {
  it("maps plane local coordinates to the same world z direction as the rendered mesh", () => {
    const width = 700;
    const depth = 600;

    const nearMaxZ = getTerrainWorldSamplePosition(-width / 2, -depth / 2, width, depth);
    const nearMinZ = getTerrainWorldSamplePosition(-width / 2, depth / 2, width, depth);

    expect(nearMaxZ.worldX).toBe(TERRAIN_MIN_X);
    expect(nearMaxZ.worldZ).toBe(TERRAIN_MAX_Z);
    expect(nearMinZ.worldZ).toBe(TERRAIN_MIN_Z);
    expect(TERRAIN_SEGMENTS).toBeGreaterThan(1);
  });
});
