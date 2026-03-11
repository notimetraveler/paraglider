import { describe, it, expect } from "vitest";
import { checkGateProgress } from "@/modules/world/gates";
import type { LevelGate } from "@/modules/world/level-types";

describe("gates", () => {
  const gates: LevelGate[] = [
    { x: 40, z: 50, radius: 45, order: 0 },
    { x: 95, z: 130, radius: 50, order: 1 },
    { x: 145, z: 190, radius: 45, order: 2 },
  ];

  it("returns passed 0 when outside first gate", () => {
    const r = checkGateProgress(0, 0, gates, 0);
    expect(r.passed).toBe(0);
    expect(r.nextIndex).toBe(0);
    expect(r.complete).toBe(false);
  });

  it("passes first gate when inside radius", () => {
    const r = checkGateProgress(40, 50, gates, 0);
    expect(r.passed).toBe(1);
    expect(r.nextIndex).toBe(1);
    expect(r.complete).toBe(false);
  });

  it("passes second gate when inside and first already passed", () => {
    const r = checkGateProgress(95, 130, gates, 1);
    expect(r.passed).toBe(2);
    expect(r.nextIndex).toBe(2);
    expect(r.complete).toBe(false);
  });

  it("returns complete when all gates passed", () => {
    const r = checkGateProgress(145, 190, gates, 2);
    expect(r.passed).toBe(3);
    expect(r.nextIndex).toBe(3);
    expect(r.complete).toBe(true);
  });

  it("does not skip gates - must pass in order", () => {
    const r = checkGateProgress(95, 130, gates, 0);
    expect(r.passed).toBe(0);
    expect(r.nextIndex).toBe(0);
  });

  it("handles empty gates", () => {
    const r = checkGateProgress(0, 0, [], 0);
    expect(r.passed).toBe(0);
    expect(r.nextIndex).toBe(0);
    expect(r.complete).toBe(true);
  });
});
