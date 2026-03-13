import { describe, it, expect } from "vitest";
import {
  terrainHeightAt,
  sampleTerrainState,
  getMountainTerrainHeight,
  getTerrainSlope,
  getTerrainBiome,
  getBiomeWeights,
  getTerrainShapeSample,
  smoothstep,
  canPlaceTree,
  FLAT_GROUND_LEVEL,
  BIOME_THRESHOLDS,
} from "@/modules/world/terrain";
import { getDefaultLevel } from "@/modules/world/level-loader";

describe("terrain", () => {
  it("samples terrain height and ALT from the same source", () => {
    const x = 0;
    const z = 260;
    const terrainHeight = terrainHeightAt(x, z);
    const sample = sampleTerrainState({
      x,
      z,
      worldY: terrainHeight + 12.5,
      getHeight: terrainHeightAt,
    });

    expect(sample.terrainHeight).toBeCloseTo(terrainHeight, 6);
    expect(sample.altitudeAboveGround).toBeCloseTo(12.5, 6);
    expect(sample.isTouchingTerrain).toBe(false);
  });

  it("reports exact terrain contact when worldY equals terrain height", () => {
    const x = 0;
    const z = 310.6;
    const terrainHeight = terrainHeightAt(x, z);
    const sample = sampleTerrainState({
      x,
      z,
      worldY: terrainHeight,
      getHeight: terrainHeightAt,
    });

    expect(sample.terrainHeight).toBeCloseTo(terrainHeight, 6);
    expect(sample.altitudeAboveGround).toBe(0);
    expect(sample.isTouchingTerrain).toBe(true);
  });

  it("terrainHeightAt matches the shared mountain terrain source", () => {
    expect(terrainHeightAt(0, 0)).toBe(getMountainTerrainHeight(0, 0));
    expect(terrainHeightAt(40, 260)).toBe(getMountainTerrainHeight(40, 260));
  });

  it("has one launch massif and a valley (Level 01 fjord valley, no second mountain)", () => {
    const firstPeak = getMountainTerrainHeight(0, 0);
    const valley = getMountainTerrainHeight(0, 220);
    const farValley = getMountainTerrainHeight(0, 430);

    expect(firstPeak).toBeGreaterThan(200);
    expect(valley).toBeLessThan(35);
    expect(farValley).toBeLessThan(80);
  });

  it("valley floor is low and positive", () => {
    const valley = getMountainTerrainHeight(300, 400);
    expect(valley).toBeGreaterThan(0);
    expect(valley).toBeLessThan(60);
  });

  it("terrain stays continuous around integer boundaries near launch", () => {
    const justBefore = getMountainTerrainHeight(-0.05, 5);
    const justAfter = getMountainTerrainHeight(0, 5);
    expect(Math.abs(justAfter - justBefore)).toBeLessThan(0.5);
  });

  it("default flight path goes from launch mountain through valley", () => {
    const level = getDefaultLevel();
    const heading = level.launch.heading;
    const airspeed = level.launch.initialSpeed;
    const windX = level.wind.x;
    const windZ = level.wind.z;
    const sampleAt = (seconds: number) => {
      const x =
        level.launch.x + (Math.sin(heading) * airspeed + windX) * seconds;
      const z =
        level.launch.z + (Math.cos(heading) * airspeed + windZ) * seconds;
      return getMountainTerrainHeight(x, z);
    };

    const launchMountain = sampleAt(0);
    const valley = sampleAt(15);
    const towardLZ = sampleAt(40);

    expect(launchMountain).toBeGreaterThan(100);
    expect(valley).toBeLessThan(60);
    expect(towardLZ).toBeLessThan(150);
  });

  it("launch massif has a clear ridge with steep drop toward the main valley", () => {
    const ridge = terrainHeightAt(0, 100);
    const westShoulder = terrainHeightAt(-80, 120);
    const eastShoulder = terrainHeightAt(90, 135);
    const valleyFloor = terrainHeightAt(0, 235);

    expect(ridge).toBeGreaterThan(145);
    expect(ridge - valleyFloor).toBeGreaterThan(85);
    expect(westShoulder).toBeGreaterThan(valleyFloor + 30);
    expect(eastShoulder).toBeGreaterThan(valleyFloor + 25);
  });

  it("landing basin stays low and flatter than the surrounding sidewalls", () => {
    const basin = getTerrainShapeSample(0, 225);
    const westWall = getTerrainShapeSample(-180, 225);
    const eastWall = getTerrainShapeSample(180, 225);

    expect(basin.height).toBeLessThan(45);
    expect(basin.slope).toBeLessThan(0.14);
    expect(westWall.height).toBeGreaterThan(basin.height + 30);
    expect(eastWall.height).toBeGreaterThan(basin.height + 30);
    expect(westWall.slope).toBeGreaterThan(basin.slope);
    expect(eastWall.slope).toBeGreaterThan(basin.slope);
  });

  it("far end of valley rises gently (Level 01 single valley, no second mountain)", () => {
    const center = terrainHeightAt(0, 420);
    const westSpread = terrainHeightAt(-90, 420);
    const eastSpread = terrainHeightAt(90, 420);

    expect(center).toBeGreaterThan(15);
    expect(westSpread).toBeGreaterThan(15);
    expect(eastSpread).toBeGreaterThan(15);
    expect(center).toBeLessThan(80);
  });

  it("reports deterministic macro shape factors for ridge and basin areas", () => {
    const ridge = getTerrainShapeSample(0, 100);
    const basin = getTerrainShapeSample(0, 225);

    expect(ridge.ridgeFactor).toBeGreaterThan(0.55);
    expect(ridge.basinFactor).toBeLessThan(0.3);
    expect(basin.basinFactor).toBeGreaterThan(0.55);
    expect(basin.ridgeFactor).toBeLessThan(0.25);
  });

  it("FLAT_GROUND_LEVEL is 0", () => {
    expect(FLAT_GROUND_LEVEL).toBe(0);
  });

  describe("getTerrainSlope", () => {
    it("returns low slope in valley", () => {
      expect(getTerrainSlope(0, 225)).toBeLessThan(0.2);
    });
    it("returns higher slope near peak", () => {
      expect(getTerrainSlope(0, 0)).toBeGreaterThan(0);
    });
  });

  describe("smoothstep", () => {
    it("returns 0 when x <= edge0", () => {
      expect(smoothstep(0.2, 0.4, 0.1)).toBe(0);
      expect(smoothstep(0.2, 0.4, 0.2)).toBe(0);
    });
    it("returns 1 when x >= edge1", () => {
      expect(smoothstep(0.2, 0.4, 0.5)).toBe(1);
      expect(smoothstep(0.2, 0.4, 0.4)).toBe(1);
    });
    it("returns value in (0,1) when x between edges", () => {
      const v = smoothstep(0.2, 0.4, 0.3);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    });
  });

  describe("getTerrainBiome", () => {
    it("returns grass in valley", () => {
      expect(getTerrainBiome(90, 225)).toBe("grass");
    });
    it("returns rock or scree on steep slopes", () => {
      const b = getTerrainBiome(0, 0);
      expect(["rock", "scree", "earth"]).toContain(b);
    });
    it("uses BIOME_THRESHOLDS for grass", () => {
      expect(BIOME_THRESHOLDS.grassMaxHeight).toBe(55);
      expect(BIOME_THRESHOLDS.grassMaxSlope).toBeLessThan(0.25);
    });
  });

  describe("getBiomeWeights", () => {
    it("returns weights that sum to 1", () => {
      const w = getBiomeWeights(150, 220);
      const sum = w.grass + w.earth + w.rock + w.scree;
      expect(sum).toBeCloseTo(1, 5);
    });
    it("valley has dominant grass weight", () => {
      const w = getBiomeWeights(90, 225);
      expect(w.grass).toBeGreaterThan(0.5);
      expect(w.grass).toBeGreaterThan(w.rock);
    });
    it("peak has dominant rock or scree weight", () => {
      const w = getBiomeWeights(0, 0);
      expect(w.rock + w.scree).toBeGreaterThan(0.4);
    });
    it("all weights are non-negative", () => {
      for (const [x, z] of [[0, 0], [150, 220], [85, 140], [200, 100]]) {
        const w = getBiomeWeights(x, z);
        expect(w.grass).toBeGreaterThanOrEqual(0);
        expect(w.earth).toBeGreaterThanOrEqual(0);
        expect(w.rock).toBeGreaterThanOrEqual(0);
        expect(w.scree).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("canPlaceTree", () => {
    it("allows trees in valley grass", () => {
      expect(canPlaceTree(90, 225)).toBe(true);
    });
    it("disallows trees on steep peak", () => {
      expect(canPlaceTree(0, 0)).toBe(false);
    });
  });
});
