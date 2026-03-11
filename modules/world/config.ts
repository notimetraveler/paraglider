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

/** Launch area - spawn position and initial flight setup */
export const LAUNCH_CONFIG: SpawnPoint & { initialSpeed: number } = {
  x: 0,
  y: 80,
  z: 0,
  heading: 0,
  initialSpeed: 8,
};

/** Altitude threshold for landed detection - within this of ground + stopped */
export const LANDED_ALTITUDE_THRESHOLD = 0.5;

/** Speed threshold (m/s) - below this when on ground = landed */
export const LANDED_SPEED_THRESHOLD = 0.5;

/** Default wind - from west (negative X) at 5 m/s - clearly noticeable drift */
export const DEFAULT_WIND: WindVector = {
  x: -5,
  z: 0,
};

/** Default thermals - sterk genoeg om goed hoogte te maken */
export const DEFAULT_THERMALS: ThermalZone[] = [
  { x: 60, z: 100, radius: 80, strength: 5.2 },
  { x: -80, z: 250, radius: 75, strength: 4.8 },
  { x: 120, z: 350, radius: 70, strength: 4.4 },
];

/** Default ridge - north-south, wind from west crosses perpendicular */
export const DEFAULT_RIDGE: RidgeLiftZone = {
  x1: -50,
  z1: 50,
  x2: -50,
  z2: 400,
  width: 55,
  strength: 2.2,
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
