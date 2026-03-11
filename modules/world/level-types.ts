/**
 * Level data types - data-driven structure for levels.
 * Future-proof for multiple levels and difficulty tiers.
 */

import type {
  SpawnPoint,
  WindVector,
  ThermalZone,
  RidgeLiftZone,
} from "./types";

/** Gate/checkpoint - cylindrical zone to fly through */
export interface LevelGate {
  x: number;
  z: number;
  radius: number;
  /** Order in sequence (0-based) */
  order: number;
}

/** Landing zone - center and radius */
export interface LandingZone {
  x: number;
  z: number;
  radius: number;
}

/** Launch configuration for a level */
export interface LevelLaunch extends SpawnPoint {
  initialSpeed: number;
}

/** Difficulty tier - for future campaign/variable conditions */
export type LevelDifficulty = "easy" | "medium" | "hard";

/** Full level data - launch, landing, environment, gates */
export interface LevelData {
  id: string;
  name: string;
  difficulty: LevelDifficulty;
  launch: LevelLaunch;
  landingZone: LandingZone;
  wind: WindVector;
  thermals: ThermalZone[];
  ridgeLift: RidgeLiftZone[];
  gates: LevelGate[];
}
