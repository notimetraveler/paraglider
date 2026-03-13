import { describe, it, expect } from "vitest";
import {
  getLevel,
  getDefaultLevel,
  environmentFromLevel,
  DEFAULT_LEVEL_ID,
} from "@/modules/world/level-loader";
import { getMountainTerrainHeight, getTerrainShapeSample } from "@/modules/world/terrain";

describe("level-loader", () => {
  it("returns mountain-01 as default (Level 01 Fjordvallei)", () => {
    const level = getDefaultLevel();
    expect(level.id).toBe("mountain-01");
    expect(level.name).toBe("Fjordvallei");
  });

  it("getLevel returns level by id", () => {
    const level = getLevel("mountain-01");
    expect(level).toBeDefined();
    expect(level?.id).toBe("mountain-01");
  });

  it("getLevel returns undefined for unknown id", () => {
    expect(getLevel("unknown")).toBeUndefined();
  });

  it("environmentFromLevel includes wind and thermals", () => {
    const level = getDefaultLevel();
    const env = environmentFromLevel(level);
    expect(typeof env.wind.x).toBe("number");
    expect(typeof env.wind.z).toBe("number");
    expect(Array.isArray(env.thermals)).toBe(true);
    expect(env.thermals.length).toBeGreaterThanOrEqual(0);
  });

  it("environmentFromLevel includes getGroundHeight for mountain level", () => {
    const level = getDefaultLevel();
    const env = environmentFromLevel(level);
    expect(env.getGroundHeight).toBeDefined();
    expect(env.obstacleColliders?.length).toBeGreaterThan(0);
    const h = env.getGroundHeight!(0, 0);
    expect(h).toBeGreaterThan(50);
  });

  it("resolves launch height from current terrain", () => {
    const level = getDefaultLevel();
    expect(level.launch.y).toBeCloseTo(
      getMountainTerrainHeight(level.launch.x, level.launch.z) + 3,
      5
    );
  });

  it("keeps launch on the ridge and landing in a low basin", () => {
    const level = getDefaultLevel();
    const launchShape = getTerrainShapeSample(level.launch.x, level.launch.z);
    const landingShape = getTerrainShapeSample(level.landingZone.x, level.landingZone.z);

    expect(launchShape.ridgeFactor).toBeGreaterThan(0.5);
    expect(landingShape.basinFactor).toBeGreaterThan(0.45);
    expect(landingShape.slope).toBeLessThan(0.12);
    if (level.gates.length > 0) {
      const lastGate = level.gates[level.gates.length - 1];
      expect(level.landingZone.z).toBeGreaterThan(lastGate.z);
    }
  });

  it("DEFAULT_LEVEL_ID is mountain-01", () => {
    expect(DEFAULT_LEVEL_ID).toBe("mountain-01");
  });
});
