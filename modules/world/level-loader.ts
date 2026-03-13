/**
 * Level loader - resolve level by id.
 * Future-proof for multiple levels and campaign structure.
 */

import type { Environment } from "./types";
import type { LevelData } from "./level-types";
import { MOUNTAIN_01 } from "./levels/mountain-01";
import { getObstacleColliders } from "./obstacles";
import { terrainHeightAt } from "./terrain";

const LAUNCH_CLEARANCE = 3;

const LEVELS: Record<string, LevelData> = {
  "mountain-01": MOUNTAIN_01,
};

function withResolvedLaunchHeight(level: LevelData): LevelData {
  const launchGround = terrainHeightAt(level.launch.x, level.launch.z);
  return {
    ...level,
    launch: {
      ...level.launch,
      y: launchGround + LAUNCH_CLEARANCE,
    },
  };
}

/**
 * Get level data by id.
 * Returns undefined if level not found.
 */
export function getLevel(id: string): LevelData | undefined {
  const level = LEVELS[id];
  if (!level) return undefined;
  return withResolvedLaunchHeight(level);
}

/**
 * Get default level id for simulator start.
 */
export const DEFAULT_LEVEL_ID = "mountain-01";

/**
 * Get the default level.
 */
export function getDefaultLevel(): LevelData {
  const level = getLevel(DEFAULT_LEVEL_ID);
  if (!level) {
    throw new Error(`Default level ${DEFAULT_LEVEL_ID} not found`);
  }
  return level;
}

/**
 * Build Environment from level data.
 * Includes wind, thermals, ridge, and terrain height.
 * All current levels use mountain terrain - always provide getGroundHeight.
 */
export function environmentFromLevel(level: LevelData): Environment {
  return {
    wind: level.wind,
    thermals: level.thermals,
    ridgeLift: level.ridgeLift,
    getGroundHeight: terrainHeightAt,
    obstacleColliders: getObstacleColliders(),
  };
}
