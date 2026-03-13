import { describe, it, expect } from "vitest";
import {
  generateSessionWind,
  windVectorFromDirectionSpeed,
  SESSION_WIND_MAX_SPEED,
  type SessionWind,
} from "@/modules/world/session-wind";

function makeDeterministicRandom(sequence: number[]): () => number {
  let index = 0;
  return () => {
    const value = sequence[index % sequence.length];
    index += 1;
    return value;
  };
}

describe("session wind", () => {
  describe("windVectorFromDirectionSpeed", () => {
    it("maps 0 rad to +Z (north)", () => {
      const v = windVectorFromDirectionSpeed(0, 5);
      expect(v.x).toBeCloseTo(0, 5);
      expect(v.z).toBeCloseTo(5, 5);
    });

    it("maps PI/2 rad to +X (east)", () => {
      const v = windVectorFromDirectionSpeed(Math.PI / 2, 3);
      expect(v.x).toBeCloseTo(3, 5);
      expect(v.z).toBeCloseTo(0, 5);
    });

    it("scales with speed", () => {
      const dir = Math.PI / 3;
      const v1 = windVectorFromDirectionSpeed(dir, 2);
      const v2 = windVectorFromDirectionSpeed(dir, 4);
      expect(Math.hypot(v1.x, v1.z)).toBeCloseTo(2, 5);
      expect(Math.hypot(v2.x, v2.z)).toBeCloseTo(4, 5);
    });
  });

  describe("generateSessionWind", () => {
    it("produces speeds within defined bands", () => {
      const rng = makeDeterministicRandom([0.1, 0.4, 0.9, 0.2, 0.6, 0.95]);
      const winds: SessionWind[] = [];
      for (let i = 0; i < 6; i++) {
        winds.push(generateSessionWind({ random: rng }));
      }

      for (const w of winds) {
        switch (w.category) {
          case "weak":
            expect(w.speed).toBeGreaterThanOrEqual(0);
            expect(w.speed).toBeLessThanOrEqual(3);
            break;
          case "medium":
            expect(w.speed).toBeGreaterThanOrEqual(3);
            expect(w.speed).toBeLessThanOrEqual(7);
            break;
          case "strong":
            expect(w.speed).toBeGreaterThanOrEqual(7);
            expect(w.speed).toBeLessThanOrEqual(9);
            break;
        }
      }
    });

    it("is deterministic for a given random sequence", () => {
      const seq = [0.12, 0.34, 0.56, 0.78];
      const rngA = makeDeterministicRandom(seq);
      const rngB = makeDeterministicRandom(seq);

      const a = generateSessionWind({ random: rngA });
      const b = generateSessionWind({ random: rngB });

      expect(a.speed).toBeCloseTo(b.speed, 6);
      expect(a.directionRad).toBeCloseTo(b.directionRad, 6);
      expect(a.x).toBeCloseTo(b.x, 6);
      expect(a.z).toBeCloseTo(b.z, 6);
      expect(a.category).toBe(b.category);
    });

    it("varies direction across 360° when no preferred direction", () => {
      const rng = makeDeterministicRandom(
        Array.from({ length: 40 }, (_, i) => (i * 0.1) % 1)
      );
      const samples = Array.from({ length: 20 }, () =>
        generateSessionWind({ random: rng })
      );
      const directions = samples.map((s) => s.directionRad);
      const uniqueQuadrants = new Set(
        directions.map((d) => Math.floor((d * 4) / (Math.PI * 2)) % 4)
      );
      expect(uniqueQuadrants.size).toBeGreaterThanOrEqual(2);
    });

    it("biases direction around preferredDirectionRad when set", () => {
      const preferred = Math.PI; // wind TO south
      const rng = makeDeterministicRandom([0.5, 0.3, 0.7, 0.9, 0.1]);

      const samples = Array.from({ length: 10 }, () =>
        generateSessionWind({ random: rng, preferredDirectionRad: preferred })
      );

      const avgDir =
        samples.reduce((sum, s) => sum + s.directionRad, 0) / samples.length;

      // Average should be reasonably close to preferred direction (within ~30°).
      const delta = Math.abs(avgDir - preferred);
      expect(delta).toBeLessThan((30 * Math.PI) / 180);
    });

    it("never exceeds SESSION_WIND_MAX_SPEED (9 m/s)", () => {
      for (let i = 0; i < 50; i++) {
        const w = generateSessionWind();
        expect(w.speed).toBeLessThanOrEqual(SESSION_WIND_MAX_SPEED);
        expect(Math.hypot(w.x, w.z)).toBeLessThanOrEqual(SESSION_WIND_MAX_SPEED + 0.01);
      }
    });
  });
});

