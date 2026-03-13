/**
 * Terrain mesh - stylized alpine terrain with height/slope-based material blending.
 * Aligned with docs/ART_DIRECTION.md.
 */

import * as THREE from "three";
import type { TerrainHeightFn } from "@/modules/world/terrain";
import {
  terrainHeightAt,
  getBiomeWeights,
} from "@/modules/world/terrain";
import { getTerrainDetailTexture } from "@/modules/rendering/world-kit";

/** Terrain extent (m) - covers flight path */
export const TERRAIN_MIN_X = -250;
const TERRAIN_MAX_X = 450;
export const TERRAIN_MIN_Z = -150;
export const TERRAIN_MAX_Z = 450;

/** Grid resolution */
export const TERRAIN_SEGMENTS = 70;

export function getTerrainWorldSamplePosition(
  localX: number,
  localY: number,
  width: number,
  depth: number
): { worldX: number; worldZ: number } {
  return {
    worldX: TERRAIN_MIN_X + (localX + width / 2),
    // PlaneGeometry is rotated around X after sampling, which flips the z direction.
    worldZ: TERRAIN_MAX_Z - (localY + depth / 2),
  };
}

/** Alpine color palette — brighter for alpine morning clarity (ART_DIRECTION) */
const COLORS = {
  grass: new THREE.Color(0x45783a),
  grassLight: new THREE.Color(0x549044),
  earth: new THREE.Color(0x7a6048),
  earthLight: new THREE.Color(0x8e7058),
  rock: new THREE.Color(0x6a6a62),
  rockLight: new THREE.Color(0x888880),
  scree: new THREE.Color(0x78786a),
  screeLight: new THREE.Color(0x969682),
} as const;

/** Blend vertex color from biome weights, height, and slope — clearer zone contrast */
function getBlendedBiomeColor(
  x: number,
  z: number,
  height: number,
  slope: number
): THREE.Color {
  const w = getBiomeWeights(x, z);
  const sunFactor = 0.9 + slope * 0.1;
  const elevFactor = Math.min(1, height / 90) * 0.14 + 0.86;

  const grassC = COLORS.grass.clone().lerp(COLORS.grassLight, sunFactor * elevFactor * 0.4);
  const earthC = COLORS.earth.clone().lerp(COLORS.earthLight, sunFactor * elevFactor * 0.4);
  const rockC = COLORS.rock.clone().lerp(COLORS.rockLight, sunFactor * elevFactor * 0.45);
  const screeC = COLORS.scree.clone().lerp(COLORS.screeLight, sunFactor * elevFactor * 0.45);

  const color = new THREE.Color(0, 0, 0);
  color.r = grassC.r * w.grass + earthC.r * w.earth + rockC.r * w.rock + screeC.r * w.scree;
  color.g = grassC.g * w.grass + earthC.g * w.earth + rockC.g * w.rock + screeC.g * w.scree;
  color.b = grassC.b * w.grass + earthC.b * w.earth + rockC.b * w.rock + screeC.b * w.scree;
  return color;
}

/** Create terrain mesh with vertex colors for biome styling */
export function createTerrainMesh(
  getHeight: TerrainHeightFn = terrainHeightAt
): THREE.Mesh {
  const width = TERRAIN_MAX_X - TERRAIN_MIN_X;
  const depth = TERRAIN_MAX_Z - TERRAIN_MIN_Z;

  const geometry = new THREE.PlaneGeometry(
    width,
    depth,
    TERRAIN_SEGMENTS,
    TERRAIN_SEGMENTS
  );

  const pos = geometry.attributes.position;
  const colors: number[] = [];
  const SLOPE_D = 1.5;

  for (let i = 0; i < pos.count; i++) {
    const localX = pos.getX(i);
    const localY = pos.getY(i);
    const { worldX, worldZ } = getTerrainWorldSamplePosition(
      localX,
      localY,
      width,
      depth
    );
    const height = getHeight(worldX, worldZ);
    pos.setZ(i, height);

    const hx = getHeight(worldX + SLOPE_D, worldZ);
    const hz = getHeight(worldX, worldZ + SLOPE_D);
    const slope = Math.min(
      1,
      Math.sqrt(
        ((hx - height) / SLOPE_D) ** 2 + ((hz - height) / SLOPE_D) ** 2
      ) * 0.5
    );

    const color = getBlendedBiomeColor(worldX, worldZ, height, slope);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(
    (TERRAIN_MIN_X + TERRAIN_MAX_X) / 2,
    0,
    (TERRAIN_MIN_Z + TERRAIN_MAX_Z) / 2
  );
  geometry.computeVertexNormals();

  const tex = getTerrainDetailTexture();
  const material = new THREE.MeshLambertMaterial({
    map: tex,
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}
