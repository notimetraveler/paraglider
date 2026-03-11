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

/**
 * Derive flight state from aircraft state.
 * airborne: flying above ground
 * landed: on ground with negligible speed
 */
export function deriveFlightState(state: AircraftState): FlightState {
  if (isLanded(state)) return "landed";
  return "airborne";
}

/**
 * Detect landing - aircraft on ground with negligible speed.
 */
export function isLanded(state: AircraftState): boolean {
  const atGround =
    state.position.y <= GROUND_LEVEL + LANDED_ALTITUDE_THRESHOLD;
  const stopped = state.airspeed < LANDED_SPEED_THRESHOLD;
  return atGround && stopped;
}

/**
 * Check if aircraft just transitioned to landed this frame.
 */
export function didJustLand(
  prevState: AircraftState,
  nextState: AircraftState
): boolean {
  return !isLanded(prevState) && isLanded(nextState);
}
