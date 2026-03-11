import { describe, it, expect } from "vitest";
import { getWindsockHeading } from "@/modules/world/windsock";

describe("windsock", () => {
  it("points downwind - wind from west means sock points east", () => {
    const heading = getWindsockHeading({ x: -5, z: 0 });
    expect(heading).toBeCloseTo(Math.PI / 2, 2); // East = +90° = π/2
  });

  it("points downwind - wind from east means sock points west", () => {
    const heading = getWindsockHeading({ x: 5, z: 0 });
    expect(heading).toBeCloseTo(-Math.PI / 2, 2);
  });

  it("returns 0 for zero wind", () => {
    const heading = getWindsockHeading({ x: 0, z: 0 });
    expect(heading).toBe(0);
  });

  it("points north when wind from south", () => {
    const heading = getWindsockHeading({ x: 0, z: -5 });
    expect(heading).toBeCloseTo(0, 2);
  });
});
