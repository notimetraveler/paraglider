import { describe, expect, it } from "vitest";
import {
  getWorldObjects,
  getObstacleColliders,
  isInLaunchClearZone,
  isInLandingClearZone,
} from "@/modules/world/obstacles";
import {
  canPlaceTree,
  getTerrainBiome,
  getTerrainShapeSample,
  terrainHeightAt,
} from "@/modules/world/terrain";

describe("world obstacles", () => {
  it("grounds every placed tree on terrain and keeps clear zones open", () => {
    const trees = getWorldObjects().filter((object) => object.kind === "tree");

    expect(trees.length).toBeGreaterThan(150);
    expect(trees.length).toBeLessThan(400);

    for (const tree of trees) {
      expect(tree.y).toBeCloseTo(terrainHeightAt(tree.x, tree.z), 6);
      expect(canPlaceTree(tree.x, tree.z)).toBe(true);
      expect(isInLaunchClearZone(tree.x, tree.z)).toBe(false);
      expect(isInLandingClearZone(tree.x, tree.z)).toBe(false);
    }
  });

  it("places rocks on plausible ridges or rocky sidewalls", () => {
    const rocks = getWorldObjects().filter((object) => object.kind === "rock");

    expect(rocks.length).toBeGreaterThan(0);

    for (const rock of rocks) {
      const shape = getTerrainShapeSample(rock.x, rock.z);
      expect(rock.y).toBeCloseTo(terrainHeightAt(rock.x, rock.z), 6);
      expect(["earth", "rock", "scree"]).toContain(getTerrainBiome(rock.x, rock.z));
      expect(shape.ridgeFactor > 0.2 || shape.sidewallFactor > 0.2).toBe(true);
    }
  });

  it("places ponds around the landing zone and grounds them on terrain", () => {
    const waters = getWorldObjects().filter((object) => object.kind === "water");
    expect(waters.length).toBe(4);

    const ids = waters.map((w) => w.id).sort();
    expect(ids).toEqual(["pond-lz-e", "pond-lz-n", "pond-lz-s", "pond-lz-w"]);

    for (const water of waters) {
      expect(water.y).toBeCloseTo(terrainHeightAt(water.x, water.z), 6);
      // Ponds mogen randgevallen zijn t.o.v. de landing clear zone, maar niet in de launch clear zone.
      expect(isInLaunchClearZone(water.x, water.z)).toBe(false);
    }
  });

  it("exposes colliders for trees and rocks only", () => {
    const colliders = getObstacleColliders();

    expect(colliders.length).toBeGreaterThan(0);
    expect(colliders.some((collider) => collider.kind === "tree")).toBe(true);
    expect(colliders.some((collider) => collider.kind === "rock")).toBe(true);
  });
});
