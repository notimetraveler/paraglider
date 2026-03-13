/**
 * Compute post-flight score summary from session data.
 * Pure functions for testability.
 */

import type { ScoreSummary } from "./types";
import type { LandingType } from "./landing-type";

export interface SessionStats {
  /** Seconds since launch */
  airtimeSeconds: number;
  /** Max altitude reached (m) */
  maxAltitude: number;
  /** Max horizontal distance from launch (m) */
  distanceFromLaunch: number;
  /** Landing quality from sink rate at touchdown */
  landingQuality?: "smooth" | "hard" | "rough";
  /** Landing type from wind + flare (downwind / into_wind_flare / into_wind_no_flare) */
  landingType?: LandingType;
  /** Base score 25/50/100 from landing type (before distance modifier) */
  baseScore?: number;
  /** Distance from touchdown to windsock/LZ center (m) */
  distanceToWindsock?: number;
  /** Points for windsock proximity: 100 at 0 m, −1% per 2 m, 0 at 200 m */
  windsockProximityPoints?: number;
  /** baseScore + windsockProximityPoints, ≥ 0 */
  finalScore?: number;
  /** Wind vector at touchdown (for summary display) */
  windX?: number;
  windZ?: number;
}

/**
 * Build score summary from session stats.
 */
export function computeScoreSummary(stats: SessionStats): ScoreSummary {
  return {
    airtime: stats.airtimeSeconds,
    maxAltitude: stats.maxAltitude,
    distance: stats.distanceFromLaunch,
  };
}

/** Format airtime as mm:ss */
export function formatAirtime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Format distance in meters */
export function formatDistance(meters: number): string {
  return `${Math.round(meters)} m`;
}

/** 1% per 2 m → 0% at 200 m */
const WINDSOCK_POINTS_MAX = 100;
const WINDSOCK_DISTANCE_ZERO_PCT_M = 200;

/**
 * Windsock proximity points: 100 at 0 m, −1% per 2 m, 0 at ≥200 m.
 * Formula: 100 * max(0, 1 - distance/200).
 */
export function computeWindsockProximityPoints(distanceToWindsockM: number): number {
  const fraction = Math.max(0, 1 - distanceToWindsockM / WINDSOCK_DISTANCE_ZERO_PCT_M);
  return Math.round(WINDSOCK_POINTS_MAX * fraction);
}

/**
 * Final score = baseScore + windsockProximityPoints, clamped to ≥ 0.
 */
export function computeFinalScore(
  baseScore: number,
  distanceToWindsockM: number
): number {
  const proximity = computeWindsockProximityPoints(distanceToWindsockM);
  return Math.max(0, baseScore + proximity);
}
