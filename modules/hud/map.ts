import type { AircraftState } from "@/modules/flight-model";
import {
  GROUND_LEVEL,
  LANDED_ALTITUDE_THRESHOLD,
  LANDED_SPEED_THRESHOLD,
} from "@/modules/world/config";
import type { HudData, HudInputDebug } from "./types";

/**
 * Map aircraft simulation state to HUD display data.
 * Pure function - no side effects.
 */
export function mapAircraftToHudData(state: AircraftState): HudData {
  const atGround =
    state.position.y <= GROUND_LEVEL + LANDED_ALTITUDE_THRESHOLD;
  const stopped = state.airspeed < LANDED_SPEED_THRESHOLD;
  const sessionState = atGround && stopped ? "landed" : "airborne";

  return {
    airspeed: state.airspeed,
    altitude: state.position.y,
    verticalSpeed: state.verticalSpeed,
    heading: state.heading,
    state: sessionState,
  };
}

/**
 * Map smoothed control inputs to debug display.
 * Pure function - no side effects.
 */
export function mapInputsToDebug(inputs: {
  steerLeft: number;
  steerRight: number;
  brake: number;
  acceleratedFlight: number;
}): HudInputDebug {
  return {
    steerLeft: inputs.steerLeft,
    steerRight: inputs.steerRight,
    brake: inputs.brake,
    acceleratedFlight: inputs.acceleratedFlight,
  };
}
