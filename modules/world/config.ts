/**
 * World configuration - launch area, terrain, landing zone.
 * Centralized for gameplay consistency.
 */

import type { SpawnPoint } from "./types";

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
