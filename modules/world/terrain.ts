/**
 * Terrain height sampling - used for collision and landing detection.
 * Pure functions for testability.
 */

/** Ground level for flat terrain (legacy default) */
export const FLAT_GROUND_LEVEL = 0;

/** Sampling step for slope calculation (m) */
const SLOPE_DELTA = 2;

/**
 * Shared terrain height source of truth for rendering, HUD altitude, and collision.
 * The player launches from the first mountain, glides out over a valley,
 * and then meets a second mountain on the default straight flight path.
 */
export function terrainHeightAt(x: number, z: number): number {
  const valleyFloor = Math.max(0, 4 + Math.abs(x) * 0.002 + z * 0.0015);
  const firstMountain = gaussianHill(x, z, 0, 0, 240, 125);
  const secondMountain = gaussianHill(x, z, 0, 430, 240, 125);
  const base = valleyFloor + firstMountain + secondMountain;
  const noise = (pseudoNoise2D(x * 0.025, z * 0.025) - 0.5) * 1.2;

  return Math.max(valleyFloor, base + noise);
}

/** Seeded pseudo-noise for deterministic terrain variation */
function pseudoNoise2D(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - Math.floor(x);
  const fz = z - Math.floor(z);
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash2D(ix, iz);
  const b = hash2D(ix + 1, iz);
  const c = hash2D(ix, iz + 1);
  const d = hash2D(ix + 1, iz + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function gaussianHill(
  x: number,
  z: number,
  cx: number,
  cz: number,
  height: number,
  falloff: number
): number {
  const dx = x - cx;
  const dz = z - cz;
  const distSq = dx * dx + dz * dz;
  return height * Math.exp(-distSq / (falloff * falloff));
}

function hash2D(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Approximate terrain slope at (x, z) - returns 0..1 (0=flat, 1=vertical).
 */
export function getTerrainSlope(x: number, z: number): number {
  const h = terrainHeightAt(x, z);
  const hx = terrainHeightAt(x + SLOPE_DELTA, z);
  const hz = terrainHeightAt(x, z + SLOPE_DELTA);
  const dx = (hx - h) / SLOPE_DELTA;
  const dz = (hz - h) / SLOPE_DELTA;
  const gradient = Math.sqrt(dx * dx + dz * dz);
  return Math.min(1, gradient * 0.5);
}

/** Biome type for terrain styling and foliage placement */
export type TerrainBiome = "grass" | "earth" | "rock" | "scree";

/** Biome thresholds - aligned with docs/ART_DIRECTION.md */
export const BIOME_THRESHOLDS = {
  grassMaxHeight: 55,
  grassMaxSlope: 0.18,
  earthMinHeight: 55,
  earthMaxHeight: 75,
  earthSlopeRange: [0.18, 0.3],
  rockMinSlope: 0.32,
  screeMinHeight: 85,
  screeMinSlope: 0.22,
} as const;

/**
 * Smooth step for blending - returns 0 for x <= edge0, 1 for x >= edge1.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Get terrain biome at (x, z) for materials and foliage.
 * Aligned with ART_DIRECTION: grass valley, earth mid-slope, rock steep, scree high exposed.
 */
export function getTerrainBiome(x: number, z: number): TerrainBiome {
  const h = terrainHeightAt(x, z);
  const slope = getTerrainSlope(x, z);

  if (slope > BIOME_THRESHOLDS.rockMinSlope) return "rock";
  if (h > BIOME_THRESHOLDS.screeMinHeight && slope > BIOME_THRESHOLDS.screeMinSlope)
    return "scree";
  if (
    h < BIOME_THRESHOLDS.grassMaxHeight &&
    slope < BIOME_THRESHOLDS.grassMaxSlope
  )
    return "grass";
  return "earth";
}

/**
 * Biome weights for smooth material blending (0..1 each, sum ≈ 1).
 * Used by terrain mesh for vertex color blending.
 */
export interface BiomeWeights {
  grass: number;
  earth: number;
  rock: number;
  scree: number;
}

export function getBiomeWeights(x: number, z: number): BiomeWeights {
  const h = terrainHeightAt(x, z);
  const slope = getTerrainSlope(x, z);

  const rock = smoothstep(0.26, 0.4, slope);
  const screeHeight = smoothstep(BIOME_THRESHOLDS.screeMinHeight, 98, h);
  const screeSlope = smoothstep(0.16, 0.32, slope);
  const scree = (1 - rock) * screeHeight * (0.5 + 0.5 * screeSlope);
  const grass =
    (1 - rock - scree) *
    (1 - smoothstep(45, 62, h)) *
    (1 - smoothstep(0.12, 0.22, slope));
  const earth = 1 - rock - scree - grass;

  const sum = grass + earth + rock + scree;
  if (sum <= 0) {
    return { grass: 0.25, earth: 0.25, rock: 0.25, scree: 0.25 };
  }
  return {
    grass: Math.max(0, grass / sum),
    earth: Math.max(0, earth / sum),
    rock: Math.max(0, rock / sum),
    scree: Math.max(0, scree / sum),
  };
}

/**
 * Can trees grow here? Only in grass biome, low slope.
 */
export function canPlaceTree(x: number, z: number): boolean {
  const biome = getTerrainBiome(x, z);
  const slope = getTerrainSlope(x, z);
  return biome === "grass" && slope < 0.2;
}

export type TerrainHeightFn = (x: number, z: number) => number;

export interface TerrainSample {
  terrainHeight: number;
  altitudeAboveGround: number;
  isTouchingTerrain: boolean;
}

export interface TerrainSampleInput {
  x: number;
  z: number;
  worldY: number;
  getHeight?: TerrainHeightFn;
}

/**
 * Backward-compatible alias while the codebase migrates to terrainHeightAt().
 */
export const getMountainTerrainHeight: TerrainHeightFn = terrainHeightAt;

/**
 * ALT / clearance above terrain at the current world position.
 */
export function altitudeAboveTerrain(
  worldY: number,
  x: number,
  z: number,
  getHeight: TerrainHeightFn = () => FLAT_GROUND_LEVEL
): number {
  return worldY - getHeight(x, z);
}

/**
 * Shared terrain sample for physics, HUD, and landing state.
 */
export function sampleTerrainState({
  x,
  z,
  worldY,
  getHeight = () => FLAT_GROUND_LEVEL,
}: TerrainSampleInput): TerrainSample {
  const terrainHeight = getHeight(x, z);
  const altitudeAboveGround = worldY - terrainHeight;

  return {
    terrainHeight,
    altitudeAboveGround,
    isTouchingTerrain: altitudeAboveGround <= 0,
  };
}
