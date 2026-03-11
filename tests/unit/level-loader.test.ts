import { describe, it, expect } from "vitest";
import {
  getLevel,
  getDefaultLevel,
  environmentFromLevel,
  DEFAULT_LEVEL_ID,
} from "@/modules/world/level-loader";

describe("level-loader", () => {
  it("returns mountain-01 as default", () => {
    const level = getDefaultLevel();
    expect(level.id).toBe("mountain-01");
    expect(level.name).toBe("Bergvallei");
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
    expect(env.wind.x).toBe(-5);
    expect(env.thermals.length).toBeGreaterThan(0);
  });

  it("environmentFromLevel includes getGroundHeight for mountain level", () => {
    const level = getDefaultLevel();
    const env = environmentFromLevel(level);
    expect(env.getGroundHeight).toBeDefined();
    const h = env.getGroundHeight!(0, 0);
    expect(h).toBeGreaterThan(50);
  });

  it("DEFAULT_LEVEL_ID is mountain-01", () => {
    expect(DEFAULT_LEVEL_ID).toBe("mountain-01");
  });
});
