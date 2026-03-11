/**
 * Level loader - resolve level by id.
 * Future-proof for multiple levels and campaign structure.
 */

import type { Environment } from "./types";
import type { LevelData } from "./level-types";
import { MOUNTAIN_01 } from "./levels/mountain-01";
import { getMountainTerrainHeight } from "./terrain";

const LEVELS: Record<string, LevelData> = {
  "mountain-01": MOUNTAIN_01,
};

/**
 * Get level data by id.
 * Returns undefined if level not found.
 */
export function getLevel(id: string): LevelData | undefined {
  return LEVELS[id];
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
 * Includes wind, thermals, ridge, and terrain height for mountain level.
 */
export function environmentFromLevel(level: LevelData): Environment {
  const getGroundHeight =
    level.id === "mountain-01"
      ? (x: number, z: number) => getMountainTerrainHeight(x, z)
      : undefined;

  return {
    wind: level.wind,
    thermals: level.thermals,
    ridgeLift: level.ridgeLift,
    getGroundHeight,
  };
}
