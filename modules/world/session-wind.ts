import type { WindVector } from "./types";

export type SessionWind = WindVector & {
  /** Wind direction in radians, TO where the air moves (0 = +Z, PI/2 = +X). */
  directionRad: number;
  /** Scalar wind speed in m/s. */
  speed: number;
  /** Optional label for category: weak / medium / strong. */
  category: "weak" | "medium" | "strong";
};

export interface SessionWindOptions {
  /**
   * Optional RNG function for deterministic tests.
   * Defaults to Math.random.
   */
  random?: () => number;
  /**
   * Optional preferred main direction in radians (wind TO where air moves).
   * When set, generated directions are softly biased around this heading.
   */
  preferredDirectionRad?: number;
}

const TWO_PI = Math.PI * 2;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function windVectorFromDirectionSpeed(
  directionRad: number,
  speed: number
): WindVector {
  const x = Math.sin(directionRad) * speed;
  const z = Math.cos(directionRad) * speed;
  return { x, z };
}

/** Max session wind speed (m/s). Above this pilots typically do not fly. */
export const SESSION_WIND_MAX_SPEED = 9;

/**
 * Generate a session wind:
 * - Speed bands (capped at SESSION_WIND_MAX_SPEED = 9 m/s):
 *   weak:   0–3 m/s
 *   medium: 3–7 m/s
 *   strong: 7–9 m/s (flyable but demanding)
 * - Direction: full 360° when no preferred direction; otherwise biased around
 *   preferredDirectionRad (e.g. west–east for coherent valley feel).
 */
export function generateSessionWind(
  options: SessionWindOptions = {}
): SessionWind {
  const rnd = options.random ?? Math.random;

  // Pick a speed band with a slight preference for medium.
  const bandPick = rnd();
  let speed: number;
  let category: SessionWind["category"];
  if (bandPick < 0.25) {
    // Weak: 0–3 m/s
    speed = rnd() * 3;
    category = "weak";
  } else if (bandPick < 0.8) {
    // Medium: 3–7 m/s
    speed = 3 + rnd() * 4;
    category = "medium";
  } else {
    // Strong but still flyable: 7–9 m/s (no flying above 9 m/s)
    speed = 7 + rnd() * 2;
    category = "strong";
  }
  speed = Math.min(speed, SESSION_WIND_MAX_SPEED);

  // Direction: full 360° by default; optional bias around preferredDirectionRad.
  let directionRad: number;
  if (options.preferredDirectionRad !== undefined) {
    const baseDirection = options.preferredDirectionRad;
    const offsetU = rnd() * 2 - 1;
    const offsetMagnitude = (1 - Math.cos(offsetU * Math.PI)) * 0.5;
    const maxSpread = (50 * Math.PI) / 180;
    directionRad = (baseDirection + offsetU * offsetMagnitude * maxSpread + TWO_PI) % TWO_PI;
  } else {
    directionRad = rnd() * TWO_PI;
  }

  const { x, z } = windVectorFromDirectionSpeed(directionRad, speed);

  return {
    x,
    z,
    directionRad,
    speed,
    category,
  };
}

