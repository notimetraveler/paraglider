/**
 * Terrain height sampling — Level 01 (Fjordvallei) only.
 * Single launch mountain, broad valley, fjord, landing basin. No second mountain.
 * Used for collision, landing, HUD altitude, and rendering.
 * Spec: docs/LEVEL_01_WORLD_SPEC.md
 */

/** Ground level for flat terrain (legacy default) */
export const FLAT_GROUND_LEVEL = 0;

/** Sampling step for slope calculation (m) */
const SLOPE_DELTA = 2;

/** Level 01: launch ridge (takeoff) */
const LAUNCH_CLEARING_X = 0;
const LAUNCH_CLEARING_Z = 100;

/** Level 01: landing field center */
const LANDING_BASIN_X = 0;
const LANDING_BASIN_Z = 312;

/** Level 01: fjord / main water body center */
const FJORD_CENTER_X = 0;
const FJORD_CENTER_Z = 248;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function elongatedGaussian(
  x: number,
  z: number,
  cx: number,
  cz: number,
  height: number,
  falloffX: number,
  falloffZ: number
): number {
  const dx = (x - cx) / falloffX;
  const dz = (z - cz) / falloffZ;
  return height * Math.exp(-(dx * dx + dz * dz));
}

function ridgeBand(
  x: number,
  z: number,
  centerCoord: number,
  alongCoord: number,
  height: number,
  acrossFalloff: number,
  alongFalloff: number,
  orientation: "east-west" | "north-south"
): number {
  if (orientation === "east-west") {
    return elongatedGaussian(
      x,
      z,
      0,
      centerCoord,
      height,
      alongFalloff,
      acrossFalloff
    );
  }
  return elongatedGaussian(
    x,
    z,
    centerCoord,
    alongCoord,
    height,
    acrossFalloff,
    alongFalloff
  );
}

function basinCut(
  x: number,
  z: number,
  cx: number,
  cz: number,
  depth: number,
  falloffX: number,
  falloffZ: number
): number {
  return elongatedGaussian(x, z, cx, cz, depth, falloffX, falloffZ);
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

/**
 * Ridge/cliff micro-detail for launch and steep slopes.
 */
function ridgedDetail(x: number, z: number, baseHeight: number): number {
  const n = pseudoNoise2D(x * 0.028, z * 0.028);
  const ridge = 1 - 2 * Math.abs(n - 0.5);
  const n2 = pseudoNoise2D(x * 0.062 + 7, z * 0.062 + 13);
  const ridge2 = 1 - 2 * Math.abs(n2 - 0.5);
  const elevFactor = smoothstep(40, 100, baseHeight);
  return (ridge * 1.8 + ridge2 * 1.2) * elevFactor;
}

/**
 * Level 01 terrain: one launch mountain, valley, fjord, landing basin.
 * Valley walls bound the corridor; far end is a gentle rise (no second mountain).
 */
export function terrainHeightAt(x: number, z: number): number {
  const regionalPedestal = 12 + z * 0.008 + Math.abs(x) * 0.006;

  // —— Launch mountain (elevated ridge, dramatic takeoff) ——
  const launchPeak = gaussianHill(x, z, -8, 8, 220, 118);
  const launchRidge = ridgeBand(x, z, 102, 0, 95, 40, 200, "east-west");
  const westShoulder = gaussianHill(x, z, -110, 132, 44, 86);
  const eastShoulder = gaussianHill(x, z, 105, 142, 36, 92);

  // —— Valley corridor (carve + fjord + landing basin) ——
  const valleyCarve = basinCut(x, z, 0, 240, 120, 160, 120);
  const fjordDepression = basinCut(
    x,
    z,
    FJORD_CENTER_X,
    FJORD_CENTER_Z,
    32,
    55,
    42
  );
  const landingBasin = basinCut(
    x,
    z,
    LANDING_BASIN_X,
    LANDING_BASIN_Z,
    22,
    95,
    75
  );
  const valleyApron = basinCut(x, z, 0, 300, 35, 140, 100);

  // —— Valley sidewalls (forested hillsides) ——
  const westWall = ridgeBand(x, z, -168, 238, 58, 46, 250, "north-south");
  const eastWall = ridgeBand(x, z, 168, 238, 56, 48, 250, "north-south");

  // —— Far end: gentle rise only (valley opens, no second mountain) ——
  const farRise = smoothstep(320, 420, z) * (28 + 0.05 * Math.abs(x));

  const baseHeight =
    regionalPedestal +
    launchPeak +
    launchRidge +
    westShoulder +
    eastShoulder +
    westWall +
    eastWall +
    farRise -
    valleyCarve -
    fjordDepression -
    landingBasin -
    valleyApron;

  const microNoise =
    (pseudoNoise2D(x * 0.018, z * 0.018) - 0.5) * 1.6 +
    (pseudoNoise2D(x * 0.045 + 11, z * 0.045 + 17) - 0.5) * 0.9;

  const ridgeDetail = ridgedDetail(x, z, baseHeight);

  const basinFloor =
    6 +
    Math.abs(x) * 0.012 +
    Math.max(0, z - LANDING_BASIN_Z) * 0.006;
  return Math.max(basinFloor, baseHeight + microNoise + ridgeDetail);
}

/**
 * Approximate terrain slope at (x, z) — 0..1 (0 = flat, 1 = vertical).
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

export type TerrainBiome = "grass" | "earth" | "rock" | "scree";

export interface TerrainShapeSample {
  height: number;
  slope: number;
  ridgeFactor: number;
  basinFactor: number;
  sidewallFactor: number;
}

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

export function getTerrainShapeSample(
  x: number,
  z: number
): TerrainShapeSample {
  const height = terrainHeightAt(x, z);
  const slope = getTerrainSlope(x, z);
  const ridgeFactor = clamp01(
    0.7 * smoothstep(110, 155, height) +
      0.3 * smoothstep(0.12, 0.26, slope) -
      0.25 * smoothstep(0.12, 0.42, Math.abs(x) / 220)
  );
  const basinFactor = clamp01(
    smoothstep(0, 1, 1 - Math.min(1, height / 58)) *
      smoothstep(0, 1, 1 - Math.min(1, slope / 0.18)) *
      (1 - smoothstep(70, 205, Math.abs(x - LANDING_BASIN_X))) *
      (1 - smoothstep(55, 135, Math.abs(z - LANDING_BASIN_Z)))
  );
  const sidewallFactor = clamp01(
    smoothstep(55, 105, Math.abs(x)) *
      smoothstep(25, 85, height) *
      smoothstep(0.12, 0.28, slope)
  );

  return {
    height,
    slope,
    ridgeFactor,
    basinFactor,
    sidewallFactor,
  };
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function getTerrainBiome(x: number, z: number): TerrainBiome {
  const h = terrainHeightAt(x, z);
  const slope = getTerrainSlope(x, z);

  if (slope > BIOME_THRESHOLDS.rockMinSlope) return "rock";
  if (
    h > BIOME_THRESHOLDS.screeMinHeight &&
    slope > BIOME_THRESHOLDS.screeMinSlope
  )
    return "scree";
  if (
    h < BIOME_THRESHOLDS.grassMaxHeight &&
    slope < BIOME_THRESHOLDS.grassMaxSlope
  )
    return "grass";
  return "earth";
}

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
  const scree =
    (1 - rock) * screeHeight * (0.5 + 0.5 * screeSlope);
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

export function canPlaceTree(x: number, z: number): boolean {
  const biome = getTerrainBiome(x, z);
  const sample = getTerrainShapeSample(x, z);
  const distToLaunch = Math.hypot(x - LAUNCH_CLEARING_X, z - LAUNCH_CLEARING_Z);
  const distToLanding = Math.hypot(
    x - LANDING_BASIN_X,
    z - LANDING_BASIN_Z
  );
  return (
    biome === "grass" &&
    sample.slope < 0.2 &&
    sample.basinFactor < 0.92 &&
    distToLaunch > 42 &&
    distToLanding > 58
  );
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

export const getMountainTerrainHeight: TerrainHeightFn = terrainHeightAt;

export function altitudeAboveTerrain(
  worldY: number,
  x: number,
  z: number,
  getHeight: TerrainHeightFn = () => FLAT_GROUND_LEVEL
): number {
  return worldY - getHeight(x, z);
}

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
