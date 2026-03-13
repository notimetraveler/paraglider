import type { AircraftState } from "./state";
import {
  GROUND_LEVEL,
  DEFAULT_ENVIRONMENT,
  LANDED_ALTITUDE_THRESHOLD,
  LANDED_SPEED_THRESHOLD,
} from "@/modules/world/config";
import type { Environment, ObstacleCollider } from "@/modules/world/types";
import { sampleTerrainState } from "@/modules/world/terrain";
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
const COLLISION_SWEEP_STEP_M = 1;
const COLLISION_BINARY_SEARCH_STEPS = 8;

interface TerrainCollisionHit {
  x: number;
  y: number;
  z: number;
}

interface ObstacleCollisionHit {
  x: number;
  y: number;
  z: number;
  t: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getGroundHeightAt(
  x: number,
  z: number,
  getGroundHeight?: (x: number, z: number) => number
): number {
  return getGroundHeight ? getGroundHeight(x, z) : GROUND_LEVEL;
}

function resolveTerrainCollision(
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  getGroundHeight?: (x: number, z: number) => number
): TerrainCollisionHit | undefined {
  if (!getGroundHeight) return undefined;

  const segmentLength = Math.hypot(
    end.x - start.x,
    end.y - start.y,
    end.z - start.z
  );
  const steps = Math.max(1, Math.ceil(segmentLength / COLLISION_SWEEP_STEP_M));

  let safeT = 0;
  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const sampleX = lerp(start.x, end.x, t);
    const sampleY = lerp(start.y, end.y, t);
    const sampleZ = lerp(start.z, end.z, t);
    const sample = sampleTerrainState({
      x: sampleX,
      z: sampleZ,
      worldY: sampleY,
      getHeight: getGroundHeight,
    });

    if (sample.isTouchingTerrain) {
      let low = safeT;
      let high = t;

      for (let i = 0; i < COLLISION_BINARY_SEARCH_STEPS; i++) {
        const mid = (low + high) / 2;
        const midX = lerp(start.x, end.x, mid);
        const midY = lerp(start.y, end.y, mid);
        const midZ = lerp(start.z, end.z, mid);
        const midSample = sampleTerrainState({
          x: midX,
          z: midZ,
          worldY: midY,
          getHeight: getGroundHeight,
        });

        if (midSample.isTouchingTerrain) {
          high = mid;
        } else {
          low = mid;
        }
      }

      const hitT = high;
      const hitX = lerp(start.x, end.x, hitT);
      const hitZ = lerp(start.z, end.z, hitT);
      return {
        x: hitX,
        z: hitZ,
        y: getGroundHeightAt(hitX, hitZ, getGroundHeight),
      };
    }

    safeT = t;
  }

  return undefined;
}

function isInsideObstacle(
  x: number,
  y: number,
  z: number,
  collider: ObstacleCollider
): boolean {
  const dx = x - collider.x;
  const dz = z - collider.z;
  const withinRadius = dx * dx + dz * dz <= collider.radius * collider.radius;
  const withinHeight = y >= collider.y && y <= collider.y + collider.height;
  return withinRadius && withinHeight;
}

function resolveObstacleCollision(
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  colliders?: ObstacleCollider[]
): ObstacleCollisionHit | undefined {
  if (!colliders?.length) return undefined;

  const segmentLength = Math.hypot(
    end.x - start.x,
    end.y - start.y,
    end.z - start.z
  );
  const steps = Math.max(1, Math.ceil(segmentLength / COLLISION_SWEEP_STEP_M));
  let earliestHit: ObstacleCollisionHit | undefined;

  for (const collider of colliders) {
    let safeT = 0;
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const sampleX = lerp(start.x, end.x, t);
      const sampleY = lerp(start.y, end.y, t);
      const sampleZ = lerp(start.z, end.z, t);

      if (isInsideObstacle(sampleX, sampleY, sampleZ, collider)) {
        let low = safeT;
        let high = t;

        for (let i = 0; i < COLLISION_BINARY_SEARCH_STEPS; i++) {
          const mid = (low + high) / 2;
          const midX = lerp(start.x, end.x, mid);
          const midY = lerp(start.y, end.y, mid);
          const midZ = lerp(start.z, end.z, mid);

          if (isInsideObstacle(midX, midY, midZ, collider)) {
            high = mid;
          } else {
            low = mid;
          }
        }

        const hitT = low;
        const hit = {
          x: lerp(start.x, end.x, hitT),
          y: lerp(start.y, end.y, hitT),
          z: lerp(start.z, end.z, hitT),
          t: hitT,
        };

        if (!earliestHit || hit.t < earliestHit.t) {
          earliestHit = hit;
        }
        break;
      }

      safeT = t;
    }
  }

  return earliestHit;
}

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
  const currentGroundAt = getGroundHeightAt(
    position.x,
    position.z,
    env.getGroundHeight
  );
  const currentTerrainSample = sampleTerrainState({
    x: position.x,
    z: position.z,
    worldY: position.y,
    getHeight: env.getGroundHeight,
  });
  const currentAltitudeAboveGround = currentTerrainSample.altitudeAboveGround;

  if (
    currentAltitudeAboveGround <= LANDED_ALTITUDE_THRESHOLD &&
    state.airspeed < LANDED_SPEED_THRESHOLD
  ) {
    return {
      ...state,
      airspeed: 0,
      verticalSpeed: 0,
      position: { ...position, y: currentGroundAt },
      velocity: { x: 0, y: 0, z: 0 },
    };
  }

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
  if (
    currentAltitudeAboveGround <= FLARE_ALTITUDE &&
    currentAltitudeAboveGround > 0 &&
    inputs.brake >= FLARE_BRAKE_THRESHOLD
  ) {
    const flareEffect = (inputs.brake - FLARE_BRAKE_THRESHOLD) / (1 - FLARE_BRAKE_THRESHOLD);
    const altitudeFactor = 1 - currentAltitudeAboveGround / FLARE_ALTITUDE;
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

  const blend = Math.min(1, dt * VERTICAL_SPEED_BLEND_RATE);
  let newVelY = velocity.y + (targetVelY - velocity.y) * blend;
  let newY = position.y + newVelY * dt;
  let newX = nextX;
  let newZ = nextZ;
  let newVelX = airVelX + env.wind.x;
  let newVelZ = airVelZ + env.wind.z;

  let touchdownSink: number | undefined;
  const collisionHit = resolveTerrainCollision(
    position,
    { x: newX, y: newY, z: newZ },
    env.getGroundHeight
  );
  const obstacleHit = resolveObstacleCollision(
    position,
    { x: newX, y: newY, z: newZ },
    env.obstacleColliders
  );

  if (collisionHit) {
    touchdownSink = Math.max(0, -newVelY);
    newX = collisionHit.x;
    newY = collisionHit.y;
    newZ = collisionHit.z;
    newVelY = 0;
    newVelX = 0;
    newVelZ = 0;
  } else if (obstacleHit) {
    touchdownSink = Math.max(0, -newVelY);
    newX = obstacleHit.x;
    newY = obstacleHit.y;
    newZ = obstacleHit.z;
    newVelY = 0;
    newVelX = 0;
    newVelZ = 0;
    return {
      ...state,
      crashed: true,
      touchdownSink,
      position: { x: newX, y: newY, z: newZ },
      velocity: { x: 0, y: 0, z: 0 },
      heading: newHeading,
      bank: newBank,
      pitchAttitude: newPitchAttitude,
      turnRate,
      airspeed: 0,
      verticalSpeed: 0,
    };
  } else {
    const nextTerrainSample = sampleTerrainState({
      x: newX,
      z: newZ,
      worldY: newY,
      getHeight: env.getGroundHeight,
    });
    const nextGroundAt = nextTerrainSample.terrainHeight;
    const nextAltitudeAboveGround = nextTerrainSample.altitudeAboveGround;

    if (nextAltitudeAboveGround <= 0) {
      touchdownSink = Math.max(0, -newVelY);
      newY = nextGroundAt;
      newVelY = 0;
      newVelX = 0;
      newVelZ = 0;
      newX = nextX;
      newZ = nextZ;
    }
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
