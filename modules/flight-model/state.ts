import type { Vec3, PilotInputs } from "./types";
import { LAUNCH_CONFIG, GROUND_LEVEL } from "@/modules/world/config";
import { SINK_AT_TRIM } from "./tuning";

/** Full aircraft simulation state */
export interface AircraftState {
  position: Vec3;
  velocity: Vec3;
  /** Forward airspeed (m/s) */
  airspeed: number;
  /** Vertical speed (m/s, positive = climb) */
  verticalSpeed: number;
  /** Heading / yaw (radians) */
  heading: number;
  /** Bank / roll angle (radians, positive = left wing down) */
  bank: number;
  /** Pitch attitude from brake/accel (radians, positive = nose up) - swing effect */
  pitchAttitude: number;
  /** Turn rate (rad/s) */
  turnRate: number;
  /** Pilot inputs applied this frame */
  inputs: PilotInputs;
}

/** Create initial aircraft state at spawn (launch position) */
export function createInitialAircraftState(
  overrides?: Partial<AircraftState>
): AircraftState {
  return {
    position: { x: 0, y: 150, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    airspeed: 8,
    verticalSpeed: 0,
    heading: 0,
    bank: 0,
    pitchAttitude: 0,
    turnRate: 0,
    inputs: {
      steerLeft: 0,
      steerRight: 0,
      brake: 0,
      acceleratedFlight: 0,
    },
    ...overrides,
  };
}

/**
 * Create aircraft state for launch - forward start with initial gliding setup.
 * Player immediately experiences flight (forward speed + sink).
 */
export function createLaunchState(): AircraftState {
  const { x, y, z, heading, initialSpeed } = LAUNCH_CONFIG;
  const vx = Math.sin(heading) * initialSpeed;
  const vz = Math.cos(heading) * initialSpeed;
  const vy = -SINK_AT_TRIM;

  return {
    position: { x, y, z },
    velocity: { x: vx, y: vy, z: vz },
    airspeed: initialSpeed,
    verticalSpeed: vy,
    heading,
    bank: 0,
    pitchAttitude: 0,
    turnRate: 0,
    inputs: {
      steerLeft: 0,
      steerRight: 0,
      brake: 0,
      acceleratedFlight: 0,
    },
  };
}

/** Re-export for tests and modules that need ground level */
export { GROUND_LEVEL };
