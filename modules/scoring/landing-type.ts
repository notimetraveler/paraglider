/**
 * Landing type and base score from wind direction and flare.
 * Pure functions for testability.
 */

import type { WindVector } from "@/modules/world/types";

export type LandingType = "downwind" | "into_wind_no_flare" | "into_wind_flare" | "crash";

/** Base scores per landing type; crash = 0 */
export const LANDING_TYPE_BASE_SCORE: Record<LandingType, number> = {
  downwind: 25,
  into_wind_no_flare: 50,
  into_wind_flare: 100,
  crash: 0,
};

/**
 * True if glider heading is more downwind than upwind.
 * Wind vector (wx, wz) = direction wind blows TO. Downwind landing = flying with the wind.
 * Heading (rad): 0 = +Z, π/2 = +X. Velocity direction = (sin(h), cos(h)).
 * Dot product with wind > 0 => same hemisphere => downwind.
 */
export function isDownwindLanding(heading: number, wind: WindVector): boolean {
  const speed = Math.hypot(wind.x, wind.z);
  if (speed < 0.1) return false;
  const dx = Math.sin(heading);
  const dz = Math.cos(heading);
  const dot = dx * wind.x + dz * wind.z;
  return dot > 0;
}

export function isIntoWindLanding(heading: number, wind: WindVector): boolean {
  return !isDownwindLanding(heading, wind);
}

/**
 * Classify landing type from wind, glider heading at touchdown, and whether
 * pilot applied sufficient flare (brake ≥ threshold) in the flare zone before landing.
 * For obstacle hit use landingType "crash" (set in UI when state.crashed).
 */
export function classifyLandingType(
  wind: WindVector,
  heading: number,
  hadFlareInFlareZone: boolean
): LandingType {
  if (isDownwindLanding(heading, wind)) return "downwind";
  if (hadFlareInFlareZone) return "into_wind_flare";
  return "into_wind_no_flare";
}

/**
 * Base score (0–100) for the landing type before distance modifier.
 */
export function getBaseScoreForLandingType(type: LandingType): number {
  return LANDING_TYPE_BASE_SCORE[type];
}
