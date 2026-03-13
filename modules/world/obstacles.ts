import {
  canPlaceTree,
  getTerrainBiome,
  getTerrainShapeSample,
  terrainHeightAt,
} from "./terrain";
import type { ObstacleCollider } from "./types";

export type WorldObjectKind = "tree" | "rock" | "water";

export interface WorldObjectPlacement {
  id: string;
  kind: WorldObjectKind;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationY: number;
  radius?: number;
  radiusX?: number;
  radiusZ?: number;
}

const LAUNCH_CLEAR_RADIUS = 42;
const LANDING_CLEAR_RADIUS = 58;
const ROUTE_CLEAR_HALF_WIDTH = 40;
const ROUTE_CLEAR_MIN_Z = 140;
const ROUTE_CLEAR_MAX_Z = 365;

/** Level 01: main fjord/lake center (aligned with terrain fjord depression) */
const FJORD_CENTER_X = 0;
const FJORD_CENTER_Z = 248;

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function isInLaunchClearZone(x: number, z: number): boolean {
  return Math.hypot(x, z - 100) <= LAUNCH_CLEAR_RADIUS;
}

export function isInLandingClearZone(x: number, z: number): boolean {
  return Math.hypot(x, z - 312) <= LANDING_CLEAR_RADIUS;
}

function isInRouteClearZone(x: number, z: number): boolean {
  return (
    Math.abs(x) <= ROUTE_CLEAR_HALF_WIDTH &&
    z >= ROUTE_CLEAR_MIN_Z &&
    z <= ROUTE_CLEAR_MAX_Z
  );
}

function canPlaceRock(x: number, z: number): boolean {
  const biome = getTerrainBiome(x, z);
  const shape = getTerrainShapeSample(x, z);
  return (
    !isInLaunchClearZone(x, z) &&
    !isInLandingClearZone(x, z) &&
    !isInRouteClearZone(x, z) &&
    ["earth", "rock", "scree"].includes(biome) &&
    (shape.ridgeFactor > 0.2 || shape.sidewallFactor > 0.2)
  );
}

function canPlaceWater(x: number, z: number): boolean {
  const shape = getTerrainShapeSample(x, z);
  return (
    !isInLaunchClearZone(x, z) &&
    !isInLandingClearZone(x, z) &&
    shape.basinFactor > 0.7 &&
    shape.slope < 0.12
  );
}


interface TreeClusterSpec {
  id: string;
  cx: number;
  cz: number;
  count: number;
  spread: number;
}

const LZ_CENTER_X = 0;
const LZ_CENTER_Z = 312;

/** Level 01: forested hillsides along valley, clear of launch/LZ/route/water */
const TREE_CLUSTERS: TreeClusterSpec[] = [
  { id: "west-forest-1", cx: -125, cz: 175, count: 6, spread: 20 },
  { id: "west-forest-2", cx: -118, cz: 268, count: 6, spread: 18 },
  { id: "west-forest-3", cx: -170, cz: 220, count: 5, spread: 16 },
  { id: "east-forest-1", cx: 122, cz: 178, count: 6, spread: 20 },
  { id: "east-forest-2", cx: 130, cz: 268, count: 6, spread: 18 },
  { id: "east-forest-3", cx: 172, cz: 222, count: 5, spread: 16 },
  // Meer bomen rond het plateau van de landingsbaan (maar buiten de LZ zelf).
  { id: "south-west", cx: -95, cz: 318, count: 6, spread: 16 },
  { id: "south-east", cx: 98, cz: 318, count: 6, spread: 16 },
  { id: "lz-north", cx: 0, cz: 278, count: 3, spread: 18 },
];

function buildTreeObjects(): WorldObjectPlacement[] {
  const objects: WorldObjectPlacement[] = [];
  let seed = 1;

  for (const cluster of TREE_CLUSTERS) {
    for (let i = 0; i < cluster.count; i++) {
      const angle = seededRandom(seed++) * Math.PI * 2;
      const distance = 3 + seededRandom(seed++) * cluster.spread;
      const x = cluster.cx + Math.cos(angle) * distance;
      const z = cluster.cz + Math.sin(angle) * distance;

      if (
        canPlaceTree(x, z) &&
        !isInLaunchClearZone(x, z) &&
        !isInLandingClearZone(x, z) &&
        !isInRouteClearZone(x, z)
      ) {
        const scale = 0.72 + seededRandom(seed++) * 0.42;
        const rotationY = seededRandom(seed++) * Math.PI * 2;
        objects.push({
          id: `tree-${cluster.id}-${i}`,
          kind: "tree",
          x,
          y: terrainHeightAt(x, z),
          z,
          scale,
          rotationY,
          radius: 1.1 * scale,
        });
      }
    }
  }

  // Extra: dense ring van bomen rond het landingsplateau (buiten de LZ en route).
  const targetExtraTrees = 200;
  let extraPlaced = 0;
  let attempts = 0;
  while (extraPlaced < targetExtraTrees && attempts < targetExtraTrees * 20) {
    attempts += 1;
    const angle = seededRandom(seed++) * Math.PI * 2;
    const radius = 70 + seededRandom(seed++) * 80; // tussen 70 m en 150 m van LZ
    const x = LZ_CENTER_X + Math.cos(angle) * radius;
    const z = LZ_CENTER_Z + Math.sin(angle) * radius;

    if (
      canPlaceTree(x, z) &&
      !isInLaunchClearZone(x, z) &&
      !isInLandingClearZone(x, z) &&
      !isInRouteClearZone(x, z)
    ) {
      const scale = 0.72 + seededRandom(seed++) * 0.42;
      const rotationY = seededRandom(seed++) * Math.PI * 2;
      objects.push({
        id: `tree-lz-ring-${extraPlaced}`,
        kind: "tree",
        x,
        y: terrainHeightAt(x, z),
        z,
        scale,
        rotationY,
        radius: 1.1 * scale,
      });
      extraPlaced += 1;
    }
  }

  return objects;
}

/** Level 01: rocks on ridges and steep slopes, clear of launch/LZ/route */
const ROCK_SPECS = [
  { id: "rock-west-1", x: -172, z: 128, scale: 8 },
  { id: "rock-east-1", x: 178, z: 132, scale: 7 },
  { id: "rock-west-2", x: -182, z: 385, scale: 8 },
  { id: "rock-east-2", x: 175, z: 398, scale: 7 },
  { id: "rock-ridge-w", x: -155, z: 248, scale: 6 },
  { id: "rock-ridge-e", x: 158, z: 252, scale: 6 },
  // Extra rotsen aan de randen van het landingsplateau
  { id: "rock-lz-nw", x: -115, z: 286, scale: 4.5 },
  { id: "rock-lz-ne", x: 115, z: 286, scale: 4.5 },
  { id: "rock-lz-s", x: 0, z: 378, scale: 5 },
];

function buildRockObjects(): WorldObjectPlacement[] {
  const objects: WorldObjectPlacement[] = [];

  for (const spec of ROCK_SPECS) {
    if (canPlaceRock(spec.x, spec.z)) {
      objects.push({
        id: spec.id,
        kind: "rock",
        x: spec.x,
        y: terrainHeightAt(spec.x, spec.z),
        z: spec.z,
        scale: spec.scale,
        rotationY: seededRandom(spec.x * 13 + spec.z * 17) * Math.PI * 2,
        radius: spec.scale * 0.95,
      });
    }
  }

  // Extra: rotsen in een band rond het landingsplateau, vooral op steilere randen.
  const targetExtraRocks = 50;
  let extraPlaced = 0;
  let seed = 10_000;
  let attempts = 0;
  while (extraPlaced < targetExtraRocks && attempts < targetExtraRocks * 30) {
    attempts += 1;
    const angle = seededRandom(seed++) * Math.PI * 2;
    const radius = 90 + seededRandom(seed++) * 90; // 90–180 m van LZ
    const x = LZ_CENTER_X + Math.cos(angle) * radius;
    const z = LZ_CENTER_Z + Math.sin(angle) * radius;

    if (canPlaceRock(x, z)) {
      const scale = 3 + seededRandom(seed++) * 4; // middelgrote rotsen
      const rotationY = seededRandom(seed++) * Math.PI * 2;
      objects.push({
        id: `rock-lz-ring-${extraPlaced}`,
        kind: "rock",
        x,
        y: terrainHeightAt(x, z),
        z,
        scale,
        rotationY,
        radius: scale * 0.95,
      });
      extraPlaced += 1;
    }
  }

  return objects;
}

/** Level 01: main fjord/lake in valley depression */
const FJORD_LAKE_SPEC = {
  x: FJORD_CENTER_X,
  z: FJORD_CENTER_Z,
  radiusX: 32,
  radiusZ: 26,
  id: "water-fjord",
};

/** Level 01: optional side inlets */
const SIDE_BASIN_SPECS = [
  { x: -82, z: 255, radiusX: 22, radiusZ: 18, id: "water-west-inlet" },
  { x: 85, z: 258, radiusX: 22, radiusZ: 18, id: "water-east-inlet" },
];

function buildWaterObject(): WorldObjectPlacement[] {
  // Legacy fjord/inlets (currently unused for Level 01).
  const out: WorldObjectPlacement[] = [];
  return out;
}

/** Level 01: watermeertjes rondom de landingsplaats */
const POND_SPECS: { id: string; x: number; z: number; radiusX: number; radiusZ: number }[] =
  [
    // West van LZ
    { id: "pond-lz-w", x: -60, z: 312, radiusX: 18, radiusZ: 14 },
    // Oost van LZ
    { id: "pond-lz-e", x: 60, z: 312, radiusX: 18, radiusZ: 14 },
    // Noord van LZ
    { id: "pond-lz-n", x: 0, z: 270, radiusX: 20, radiusZ: 15 },
    // Zuid van LZ
    { id: "pond-lz-s", x: 0, z: 354, radiusX: 20, radiusZ: 15 },
  ];

function buildPondObjects(): WorldObjectPlacement[] {
  return POND_SPECS.map((spec) => ({
    id: spec.id,
    kind: "water",
    x: spec.x,
    y: terrainHeightAt(spec.x, spec.z),
    z: spec.z,
    scale: 1,
    rotationY: 0,
    radiusX: spec.radiusX,
    radiusZ: spec.radiusZ,
  }));
}

const WORLD_OBJECTS: WorldObjectPlacement[] = [
  ...buildTreeObjects(),
  ...buildRockObjects(),
  ...buildPondObjects(),
];

export function getWorldObjects(): WorldObjectPlacement[] {
  return WORLD_OBJECTS;
}

export function getObstacleColliders(): ObstacleCollider[] {
  const colliders: ObstacleCollider[] = [];

  for (const object of WORLD_OBJECTS) {
    if (object.kind === "tree") {
      colliders.push({
        id: object.id,
        kind: "tree",
        x: object.x,
        y: object.y,
        z: object.z,
        radius: object.radius ?? object.scale,
        height: 7.2 * object.scale,
      });
      continue;
    }

    if (object.kind === "rock") {
      colliders.push({
        id: object.id,
        kind: "rock",
        x: object.x,
        y: object.y,
        z: object.z,
        radius: object.radius ?? object.scale,
        height: 1.6 * object.scale,
      });
    }
  }

  return colliders;
}
