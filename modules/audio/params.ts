/**
 * Audio parameter mapping - sim state to audio params.
 * Pure functions for testability.
 */

/** Airspeed range for wind gain (m/s) */
export const WIND_SPEED_MIN = 2;
export const WIND_SPEED_MAX = 12;

/** Map airspeed (m/s) to wind gain 0..1 */
export function airspeedToWindGain(airspeed: number): number {
  if (airspeed <= WIND_SPEED_MIN) return 0;
  const t = Math.min(1, (airspeed - WIND_SPEED_MIN) / (WIND_SPEED_MAX - WIND_SPEED_MIN));
  return t * t;
}

/** Landing quality to volume multiplier */
export const LANDING_VOLUME: Record<string, number> = {
  smooth: 0.25,
  hard: 0.5,
  rough: 0.75,
};

/** Map touchdown sink (m/s) to landing sound duration (s) */
export function sinkToLandingDuration(sink: number): number {
  return Math.min(0.15, Math.max(0.05, sink * 0.04));
}
