/**
 * Compute post-flight score summary from session data.
 * Pure functions for testability.
 */

import type { ScoreSummary } from "./types";

export interface SessionStats {
  /** Seconds since launch */
  airtimeSeconds: number;
  /** Max altitude reached (m) */
  maxAltitude: number;
  /** Max horizontal distance from launch (m) */
  distanceFromLaunch: number;
  /** Landing quality from sink rate at touchdown */
  landingQuality?: "smooth" | "hard" | "rough";
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
