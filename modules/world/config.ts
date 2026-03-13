/**
 * World configuration - launch area, terrain, wind, lift zones.
 * Centralized for gameplay consistency.
 */

import type {
  SpawnPoint,
  WindVector,
  ThermalZone,
  RidgeLiftZone,
  Environment,
} from "./types";

/** Ground level (m) - terrain collision plane */
export const GROUND_LEVEL = 0;

/** Landing zone radius (m) - visual reference for approach */
export const LANDING_ZONE_RADIUS = 70;

/** Launch area - spawn position and initial flight setup */
export const LAUNCH_CONFIG: SpawnPoint & { initialSpeed: number } = {
  x: 0,
  y: 80,
  z: 0,
  heading: 0,
  initialSpeed: 8,
};

/** True if (x,z) is within landing zone */
export function isInLandingZone(
  x: number,
  z: number,
  center?: { x: number; z: number },
  radius?: number
): boolean {
  const cx = center?.x ?? LAUNCH_CONFIG.x;
  const cz = center?.z ?? LAUNCH_CONFIG.z;
  const r = radius ?? LANDING_ZONE_RADIUS;
  const dx = x - cx;
  const dz = z - cz;
  return Math.sqrt(dx * dx + dz * dz) <= r;
}

/** Altitude threshold for landed detection - within this of ground + stopped */
export const LANDED_ALTITUDE_THRESHOLD = 0.5;

/** Speed threshold (m/s) - below this when on ground = landed */
export const LANDED_SPEED_THRESHOLD = 0.5;

/** Default wind - from west at 5 m/s - drift east (positive X), ridge on drift path */
export const DEFAULT_WIND: WindVector = {
  x: 5,
  z: 0,
};

/**
 * Default thermals - coherent with wind drift.
 * Starter thermal near launch for first minutes; others downwind.
 * Strengths balanced so lift is rewarding but sink still matters (~2–3 m/s core).
 */
export const DEFAULT_THERMALS: ThermalZone[] = [
  { x: 35, z: 45, radius: 55, strength: 2.8 },
  { x: 90, z: 120, radius: 65, strength: 2.5 },
  { x: 140, z: 280, radius: 60, strength: 2.2 },
];

/**
 * Default ridge - downwind of launch so player encounters it when drifting east.
 * North-south line at x=85; wind from west crosses perpendicular.
 */
export const DEFAULT_RIDGE: RidgeLiftZone = {
  x1: 85,
  z1: 60,
  x2: 85,
  z2: 380,
  width: 50,
  strength: 1.5,
};

/** Default environment */
export const DEFAULT_ENVIRONMENT: Environment = {
  wind: DEFAULT_WIND,
  thermals: DEFAULT_THERMALS,
  ridgeLift: [DEFAULT_RIDGE],
};

/** Environment with no wind or lift - for deterministic tests */
export const ZERO_ENVIRONMENT: Environment = {
  wind: { x: 0, z: 0 },
  thermals: [],
  ridgeLift: [],
};
