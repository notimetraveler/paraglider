import type { AircraftState } from "./state";
import { GROUND_LEVEL } from "@/modules/world/config";

const SIM_DT = 1 / 60; // Fixed timestep for deterministic simulation

/** Base trim speed (m/s) - typical paraglider 22-28 km/h */
const TRIM_SPEED = 8;
/** Brake: min speed factor at full brake */
const BRAKE_SPEED_FACTOR = 0.45;
/** Accelerated flight: max speed factor */
const ACCEL_FACTOR = 1.5;

/** Sink rate at trim (m/s) - real paragliders ~1.2-1.4 m/s */
const SINK_AT_TRIM = 1.3;
/** Sink rate at full brake - less sink */
const SINK_AT_FULL_BRAKE = 0.7;
/** Sink rate at full speed bar - more sink */
const SINK_AT_FULL_ACCEL = 2.8;
const G = 9.81;
/** Max bank angle (radians) - paraglider typical ~35° */
const MAX_BANK = (35 * Math.PI) / 180;
/** Bank rate when steering - wing inertia, gradual build (rad/s) */
const BANK_RATE_UP = 1.2;
/** Bank decay when not steering - wing naturally levels (rad/s) */
const BANK_RATE_DOWN = 1.8;
/** Extra sink factor when banked - turn cost */
const BANK_SINK_FACTOR = 0.15;
/** Max pitch attitude from brake/accel (radians) - brake=horizon up, accel=horizon down */
const MAX_PITCH_ATTITUDE = (10 * Math.PI) / 180;
/** Pitch attitude: smooth build when applying brake/accel */
const PITCH_ATTITUDE_RATE_UP = 1.2;
/** Pitch attitude: smooth return to neutral when releasing */
const PITCH_ATTITUDE_RATE_DOWN = 1.8;

/**
 * Advance flight simulation by one fixed timestep.
 * Uses paraglider-typical sink rates (not free fall).
 * Includes ground collision - aircraft cannot go below GROUND_LEVEL.
 */
export function simulateStep(
  state: AircraftState,
  dt: number = SIM_DT
): AircraftState {
  const { position, velocity, heading, inputs } = state;

  const steerNet = inputs.steerLeft - inputs.steerRight;

  // Bank follows steer input with inertia; decays toward level when not steering
  const targetBank = steerNet * MAX_BANK;
  const bankRate = targetBank === 0 ? BANK_RATE_DOWN : BANK_RATE_UP;
  const bankBlend = Math.min(1, dt * bankRate);
  const newBank = state.bank + (targetBank - state.bank) * bankBlend;

  // Pitch attitude: brake=horizon up (nose down), accel=horizon down (nose up). Returns to 0 when released.
  const targetPitchAttitude =
    (inputs.acceleratedFlight - inputs.brake) * MAX_PITCH_ATTITUDE;
  const pitchRate =
    targetPitchAttitude === 0 ? PITCH_ATTITUDE_RATE_DOWN : PITCH_ATTITUDE_RATE_UP;
  const pitchBlend = Math.min(1, dt * pitchRate);
  const newPitchAttitude =
    state.pitchAttitude + (targetPitchAttitude - state.pitchAttitude) * pitchBlend;

  // Brake reduces speed; accelerated flight increases it
  let speedMult = 1;
  if (inputs.brake > 0) speedMult -= (1 - BRAKE_SPEED_FACTOR) * inputs.brake;
  if (inputs.acceleratedFlight > 0)
    speedMult += (ACCEL_FACTOR - 1) * inputs.acceleratedFlight;
  const forwardSpeed = Math.max(2, TRIM_SPEED * speedMult);

  // Coordinated turn: turn rate from bank (physics) - omega = g*tan(bank)/v
  const horizontalSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2) || forwardSpeed;
  const turnRate = horizontalSpeed > 0.5 ? (G * Math.tan(newBank)) / horizontalSpeed : 0;

  // Paraglider sink rate: interpolate between trim, brake, and accel
  const brakeSink = SINK_AT_FULL_BRAKE;
  const accelSink = SINK_AT_FULL_ACCEL;
  const sinkRate =
    SINK_AT_TRIM * (1 - inputs.brake - inputs.acceleratedFlight) +
    brakeSink * inputs.brake +
    accelSink * inputs.acceleratedFlight;
  // Bank increases sink (turn cost)
  const bankSinkExtra = Math.abs(newBank) * BANK_SINK_FACTOR * sinkRate;
  const targetVelY = -(sinkRate + bankSinkExtra);

  const newHeading = heading + turnRate * dt;
  const dx = Math.sin(newHeading) * forwardSpeed * dt;
  const dz = Math.cos(newHeading) * forwardSpeed * dt;

  const blend = Math.min(1, dt * 8);
  let newVelY = velocity.y + (targetVelY - velocity.y) * blend;
  let newY = position.y + newVelY * dt;
  let newX = position.x + dx;
  let newZ = position.z + dz;
  let newVelX = Math.sin(newHeading) * forwardSpeed;
  let newVelZ = Math.cos(newHeading) * forwardSpeed;

  if (newY < GROUND_LEVEL) {
    newY = GROUND_LEVEL;
    newVelY = 0;
    newVelX = 0;
    newVelZ = 0;
    newX = position.x;
    newZ = position.z;
  }

  return {
    ...state,
    bank: newBank,
    pitchAttitude: newPitchAttitude,
    position: {
      x: newX,
      y: newY,
      z: newZ,
    },
    velocity: {
      x: newVelX,
      y: newVelY,
      z: newVelZ,
    },
    heading: newHeading,
    turnRate,
    airspeed: newVelY === 0 && newVelX === 0 && newVelZ === 0 ? 0 : forwardSpeed,
    verticalSpeed: newVelY,
  };
}
