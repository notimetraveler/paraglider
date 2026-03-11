import type { AircraftState } from "@/modules/flight-model";
import {
  GROUND_LEVEL,
  LAUNCH_CONFIG,
  LANDED_ALTITUDE_THRESHOLD,
  LANDED_SPEED_THRESHOLD,
} from "@/modules/world/config";
import { getThermalLift, getRidgeLift } from "@/modules/world/lift";
import type { Environment } from "@/modules/world/types";
import type { HudData, HudInputDebug } from "./types";

/** Optional level-based overrides for HUD mapping */
export interface HudMapOptions {
  getGroundHeight?: (x: number, z: number) => number;
  landingZone?: { x: number; z: number };
  gateProgress?: { passed: number; total: number };
}

/**
 * Map aircraft simulation state to HUD display data.
 * Pure function - no side effects.
 */
export function mapAircraftToHudData(
  state: AircraftState,
  env: Environment,
  options?: HudMapOptions
): HudData {
  const groundAt = options?.getGroundHeight
    ? options.getGroundHeight(state.position.x, state.position.z)
    : GROUND_LEVEL;
  const atGround =
    state.position.y <= groundAt + LANDED_ALTITUDE_THRESHOLD;
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

  const lzCenter = options?.landingZone ?? { x: LAUNCH_CONFIG.x, z: LAUNCH_CONFIG.z };
  const dx = state.position.x - lzCenter.x;
  const dz = state.position.z - lzCenter.z;
  const distanceToLz =
    state.position.y < 150 && state.position.y > groundAt
      ? Math.sqrt(dx * dx + dz * dz)
      : undefined;

  const heightAboveGround = state.position.y - groundAt;
  const inFlareZone =
    sessionState === "airborne" &&
    heightAboveGround <= 4 &&
    heightAboveGround > 0;

  return {
    airspeed: state.airspeed,
    altitude: state.position.y,
    verticalSpeed: state.verticalSpeed,
    heading: state.heading,
    state: sessionState,
    windX: env.wind.x,
    windZ: env.wind.z,
    thermalLift: thermalLift + ridgeLift,
    inFlareZone,
    ...(distanceToLz !== undefined && { distanceToLz }),
    ...(options?.gateProgress &&
      options.gateProgress.total > 0 && {
        gateProgress: options.gateProgress,
      }),
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
