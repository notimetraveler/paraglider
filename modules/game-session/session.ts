/**
 * Session state logic - flight state derivation, landed detection, reset.
 * Pure functions for testability.
 */

import type { AircraftState } from "@/modules/flight-model";
import type { FlightState } from "@/modules/flight-model/types";
import {
  GROUND_LEVEL,
  LANDED_ALTITUDE_THRESHOLD,
  LANDED_SPEED_THRESHOLD,
} from "@/modules/world/config";
import { sampleTerrainState } from "@/modules/world/terrain";

/** Optional terrain height function - if not provided, uses flat ground (0) */
export type GroundHeightFn = (x: number, z: number) => number;

/**
 * Derive flight state from aircraft state.
 * airborne: flying above ground
 * landed: on ground with negligible speed
 */
export function deriveFlightState(
  state: AircraftState,
  getGroundHeight?: GroundHeightFn
): FlightState {
  if (isLanded(state, getGroundHeight)) return "landed";
  return "airborne";
}

/**
 * Detect landing - aircraft on ground with negligible speed.
 */
export function isLanded(
  state: AircraftState,
  getGroundHeight?: GroundHeightFn
): boolean {
  const terrainSample = sampleTerrainState({
    x: state.position.x,
    z: state.position.z,
    worldY: state.position.y,
    getHeight: getGroundHeight ?? (() => GROUND_LEVEL),
  });
  const atGround =
    terrainSample.altitudeAboveGround <= LANDED_ALTITUDE_THRESHOLD;
  const stopped = state.airspeed < LANDED_SPEED_THRESHOLD;
  return atGround && stopped;
}

/**
 * Check if aircraft just transitioned to landed this frame.
 */
export function didJustLand(
  prevState: AircraftState,
  nextState: AircraftState,
  getGroundHeight?: GroundHeightFn
): boolean {
  return (
    !isLanded(prevState, getGroundHeight) && isLanded(nextState, getGroundHeight)
  );
}

/** Landing quality based on sink rate at touchdown (m/s, positive = downward) */
export type LandingQuality = "smooth" | "hard" | "rough";

/** Thresholds (m/s sink): smooth < 1.0, hard 1.0–2.5, rough > 2.5 */
export const SMOOTH_LANDING_THRESHOLD = 1.0;
export const HARD_LANDING_THRESHOLD = 2.5;

const SMOOTH_THRESHOLD = SMOOTH_LANDING_THRESHOLD;
const HARD_THRESHOLD = HARD_LANDING_THRESHOLD;

/**
 * Classify landing quality from sink rate at touchdown.
 * Paraglider-typical: good flare < 1 m/s, heavy 1–2.5, rough > 2.5.
 */
export function classifyLandingQuality(sinkRate: number): LandingQuality {
  if (sinkRate < SMOOTH_THRESHOLD) return "smooth";
  if (sinkRate <= HARD_THRESHOLD) return "hard";
  return "rough";
}
