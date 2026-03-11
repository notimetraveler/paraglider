import type { AircraftState } from "./state";
import { GROUND_LEVEL, DEFAULT_ENVIRONMENT } from "@/modules/world/config";
import type { Environment } from "@/modules/world/types";
import { getThermalLift, getRidgeLift } from "@/modules/world/lift";
import {
  SIM_DT,
  TRIM_SPEED,
  MIN_SPEED,
  BRAKE_SPEED_FACTOR,
  ACCEL_SPEED_FACTOR,
  SINK_AT_TRIM,
  SINK_AT_FULL_BRAKE,
  SINK_AT_FULL_ACCEL,
  MAX_BANK,
  BANK_RATE_UP,
  BANK_RATE_DOWN,
  BANK_SINK_FACTOR,
  MAX_PITCH_ATTITUDE,
  PITCH_ATTITUDE_RATE_UP,
  PITCH_ATTITUDE_RATE_DOWN,
  VERTICAL_SPEED_BLEND_RATE,
  FLARE_ALTITUDE,
  FLARE_BRAKE_THRESHOLD,
  FLARE_SINK_REDUCTION,
  STALL_BRAKE_THRESHOLD,
  STALL_SINK_PENALTY,
} from "./tuning";

const G = 9.81;

/**
 * Advance flight simulation by one fixed timestep.
 * Paraglider-typical: sink, coordinated turns, brake/accel polar, flare, near-stall.
 */
export function simulateStep(
  state: AircraftState,
  dt: number = SIM_DT,
  env: Environment = DEFAULT_ENVIRONMENT
): AircraftState {
  const { position, velocity, heading, inputs } = state;

  const steerNet = inputs.steerLeft - inputs.steerRight;

  // Bank: slower build for more paraglider inertia
  const targetBank = steerNet * MAX_BANK;
  const bankRate = targetBank === 0 ? BANK_RATE_DOWN : BANK_RATE_UP;
  const bankBlend = Math.min(1, dt * bankRate);
  const newBank = state.bank + (targetBank - state.bank) * bankBlend;

  // Pitch attitude: brake=horizon up, accel=horizon down
  const targetPitchAttitude =
    (inputs.acceleratedFlight - inputs.brake) * MAX_PITCH_ATTITUDE;
  const pitchRate =
    targetPitchAttitude === 0 ? PITCH_ATTITUDE_RATE_DOWN : PITCH_ATTITUDE_RATE_UP;
  const pitchBlend = Math.min(1, dt * pitchRate);
  const newPitchAttitude =
    state.pitchAttitude + (targetPitchAttitude - state.pitchAttitude) * pitchBlend;

  // Speed: brake reduces, accel increases
  let speedMult = 1;
  if (inputs.brake > 0) speedMult -= (1 - BRAKE_SPEED_FACTOR) * inputs.brake;
  if (inputs.acceleratedFlight > 0)
    speedMult += (ACCEL_SPEED_FACTOR - 1) * inputs.acceleratedFlight;
  const forwardSpeed = Math.max(MIN_SPEED, TRIM_SPEED * speedMult);

  // Coordinated turn: omega = g*tan(bank)/v
  const horizontalSpeed =
    Math.sqrt(velocity.x ** 2 + velocity.z ** 2) || forwardSpeed;
  const turnRate =
    horizontalSpeed > 0.5 ? (G * Math.tan(newBank)) / horizontalSpeed : 0;

  // Sink: interpolate trim/brake/accel polar
  let sinkRate =
    SINK_AT_TRIM * (1 - inputs.brake - inputs.acceleratedFlight) +
    SINK_AT_FULL_BRAKE * inputs.brake +
    SINK_AT_FULL_ACCEL * inputs.acceleratedFlight;

  // Turn-induced sink (energy loss in bank)
  const bankSinkExtra = Math.abs(newBank) * BANK_SINK_FACTOR * sinkRate;
  sinkRate += bankSinkExtra;

  // Near-stall: over-braking increases sink
  if (inputs.brake > STALL_BRAKE_THRESHOLD) {
    const overBrake = (inputs.brake - STALL_BRAKE_THRESHOLD) / (1 - STALL_BRAKE_THRESHOLD);
    sinkRate += STALL_SINK_PENALTY * overBrake;
  }

  // Flare: near ground, braking reduces sink (softer touchdown)
  const groundHere = env.getGroundHeight
    ? env.getGroundHeight(position.x, position.z)
    : GROUND_LEVEL;
  const heightAboveGround = position.y - groundHere;
  if (
    heightAboveGround <= FLARE_ALTITUDE &&
    heightAboveGround > 0 &&
    inputs.brake >= FLARE_BRAKE_THRESHOLD
  ) {
    const flareEffect = (inputs.brake - FLARE_BRAKE_THRESHOLD) / (1 - FLARE_BRAKE_THRESHOLD);
    const altitudeFactor = 1 - heightAboveGround / FLARE_ALTITUDE;
    sinkRate -= FLARE_SINK_REDUCTION * flareEffect * altitudeFactor;
  }
  sinkRate = Math.max(0.15, sinkRate);

  const newHeading = heading + turnRate * dt;
  const airVelX = Math.sin(newHeading) * forwardSpeed;
  const airVelZ = Math.cos(newHeading) * forwardSpeed;
  const dx = (airVelX + env.wind.x) * dt;
  const dz = (airVelZ + env.wind.z) * dt;
  const nextX = position.x + dx;
  const nextZ = position.z + dz;

  const thermalLift = getThermalLift(nextX, nextZ, env.thermals);
  const ridgeLift = getRidgeLift(nextX, nextZ, env.ridgeLift, env.wind);
  const targetVelY = -sinkRate + thermalLift + ridgeLift;

  const groundAt = env.getGroundHeight
    ? env.getGroundHeight(nextX, nextZ)
    : GROUND_LEVEL;

  const blend = Math.min(1, dt * VERTICAL_SPEED_BLEND_RATE);
  let newVelY = velocity.y + (targetVelY - velocity.y) * blend;
  let newY = position.y + newVelY * dt;
  let newX = nextX;
  let newZ = nextZ;
  let newVelX = airVelX + env.wind.x;
  let newVelZ = airVelZ + env.wind.z;

  let touchdownSink: number | undefined;
  if (newY < groundAt) {
    touchdownSink = Math.max(0, -newVelY);
    newY = groundAt;
    newVelY = 0;
    newVelX = 0;
    newVelZ = 0;
    newX = position.x;
    newZ = position.z;
  }

  return {
    ...state,
    touchdownSink,
    bank: newBank,
    pitchAttitude: newPitchAttitude,
    position: { x: newX, y: newY, z: newZ },
    velocity: { x: newVelX, y: newVelY, z: newVelZ },
    heading: newHeading,
    turnRate,
    airspeed:
      newVelY === 0 && newVelX === 0 && newVelZ === 0 ? 0 : forwardSpeed,
    verticalSpeed: newVelY,
    ...(touchdownSink !== undefined && { touchdownSink }),
  };
}
