import type { AircraftState } from "@/modules/flight-model";
import {
  GROUND_LEVEL,
  LANDED_ALTITUDE_THRESHOLD,
  LANDED_SPEED_THRESHOLD,
} from "@/modules/world/config";
import { getThermalLift, getRidgeLift } from "@/modules/world/lift";
import type { Environment } from "@/modules/world/types";
import type { HudData, HudInputDebug } from "./types";

/**
 * Map aircraft simulation state to HUD display data.
 * Pure function - no side effects.
 */
export function mapAircraftToHudData(
  state: AircraftState,
  env: Environment
): HudData {
  const atGround =
    state.position.y <= GROUND_LEVEL + LANDED_ALTITUDE_THRESHOLD;
  const stopped = state.airspeed < LANDED_SPEED_THRESHOLD;
  const sessionState = atGround && stopped ? "landed" : "airborne";
  const thermalLift = getThermalLift(
    state.position.x,
    state.position.z,
    env.thermals
  );
  const ridgeLift = getRidgeLift(
    state.position.x,
    state.position.z,
    env.ridgeLift,
    env.wind
  );

  return {
    airspeed: state.airspeed,
    altitude: state.position.y,
    verticalSpeed: state.verticalSpeed,
    heading: state.heading,
    state: sessionState,
    windX: env.wind.x,
    windZ: env.wind.z,
    thermalLift: thermalLift + ridgeLift,
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
