/**
 * Terrain height sampling - used for collision and landing detection.
 * Pure functions for testability.
 */

/** Ground level for flat terrain (legacy default) */
export const FLAT_GROUND_LEVEL = 0;

/** Sampling step for slope calculation (m) */
const SLOPE_DELTA = 2;

/**
 * Simple procedural heightmap for mountain level.
 * Creates a believable alpine landscape with varied relief.
 * - Mountain peak near origin
 * - Valley/lowland toward positive x/z
 * - Secondary ridge, subtle noise for natural feel
 */
export function getMountainTerrainHeight(x: number, z: number): number {
  const peakX = 0;
  const peakZ = 0;
  const peakHeight = 118;
  const peakFalloff = 165;

  const dx = x - peakX;
  const dz = z - peakZ;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const mountain =
    peakHeight * Math.exp(-(dist * dist) / (peakFalloff * peakFalloff));

  const ridgeX = 75;
  const ridgeZ = 140;
  const ridgeDx = x - ridgeX;
  const ridgeDz = z - ridgeZ;
  const ridgeDist = Math.sqrt(ridgeDx * ridgeDx + ridgeDz * ridgeDz);
  const ridge = 28 * Math.exp(-(ridgeDist * ridgeDist) / (100 * 100));

  const valleyFloor = Math.max(0, 6 + x * 0.018 + z * 0.012);

  const base = Math.max(valleyFloor, mountain + ridge * 0.35);

  const noise = pseudoNoise2D(x * 0.03, z * 0.03) * 3;
  return base + noise;
}

/** Seeded pseudo-noise for deterministic terrain variation */
function pseudoNoise2D(x: number, z: number): number {
  const ix = Math.floor(x) & 255;
  const iz = Math.floor(z) & 255;
  const fx = x - Math.floor(x);
  const fz = z - Math.floor(z);
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash(ix + iz * 257);
  const b = hash(ix + 1 + iz * 257);
  const c = hash(ix + (iz + 1) * 257);
  const d = hash(ix + 1 + (iz + 1) * 257);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Approximate terrain slope at (x, z) - returns 0..1 (0=flat, 1=vertical).
 */
export function getTerrainSlope(x: number, z: number): number {
  const h = getMountainTerrainHeight(x, z);
  const hx = getMountainTerrainHeight(x + SLOPE_DELTA, z);
  const hz = getMountainTerrainHeight(x, z + SLOPE_DELTA);
  const dx = (hx - h) / SLOPE_DELTA;
  const dz = (hz - h) / SLOPE_DELTA;
  const gradient = Math.sqrt(dx * dx + dz * dz);
  return Math.min(1, gradient * 0.5);
}

/** Biome type for terrain styling and foliage placement */
export type TerrainBiome = "grass" | "earth" | "rock" | "scree";

/**
 * Get terrain biome at (x, z) for materials and foliage.
 * grass: valley floor, low slope
 * earth: mid-slope, moderate
 * rock: steep slopes, ridges
 * scree: high elevation, exposed
 */
export function getTerrainBiome(x: number, z: number): TerrainBiome {
  const h = getMountainTerrainHeight(x, z);
  const slope = getTerrainSlope(x, z);

  if (h > 90 && slope > 0.25) return "scree";
  if (slope > 0.35) return "rock";
  if (slope > 0.15 || h > 70) return "earth";
  return "grass";
}

/**
 * Can trees grow here? Only in grass biome, low slope.
 */
export function canPlaceTree(x: number, z: number): boolean {
  const biome = getTerrainBiome(x, z);
  const slope = getTerrainSlope(x, z);
  return biome === "grass" && slope < 0.2;
}

/**
 * Get ground height at (x, z).
 * For flat terrain (no level), returns FLAT_GROUND_LEVEL.
 */
export type TerrainHeightFn = (x: number, z: number) => number;
