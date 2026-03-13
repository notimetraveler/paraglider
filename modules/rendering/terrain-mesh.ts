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

/** Alpine color palette - docs/ART_DIRECTION.md */
const COLORS = {
  grass: new THREE.Color(0x3d6b2f),
  grassLight: new THREE.Color(0x4a7c3a),
  earth: new THREE.Color(0x6b5344),
  earthLight: new THREE.Color(0x7d6354),
  rock: new THREE.Color(0x5c5c5c),
  rockLight: new THREE.Color(0x787878),
  scree: new THREE.Color(0x6b6b5c),
  screeLight: new THREE.Color(0x8a8a78),
} as const;

/** Blend vertex color from biome weights, height, and slope */
function getBlendedBiomeColor(
  x: number,
  z: number,
  height: number,
  slope: number
): THREE.Color {
  const w = getBiomeWeights(x, z);
  const sunFactor = 0.88 + slope * 0.12;
  const elevFactor = Math.min(1, height / 90) * 0.12 + 0.88;

  const grassC = COLORS.grass.clone().lerp(COLORS.grassLight, sunFactor * elevFactor * 0.35);
  const earthC = COLORS.earth.clone().lerp(COLORS.earthLight, sunFactor * elevFactor * 0.35);
  const rockC = COLORS.rock.clone().lerp(COLORS.rockLight, sunFactor * elevFactor * 0.4);
  const screeC = COLORS.scree.clone().lerp(COLORS.screeLight, sunFactor * elevFactor * 0.4);

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

  const tex = createTerrainDetailTexture();
  const material = new THREE.MeshLambertMaterial({
    map: tex,
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

/** Subtle organic detail texture - multiplies with vertex colors for micro-variation */
function createTerrainDetailTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = Math.sin(x * 0.4 + y * 0.3) * 0.5 + Math.sin(x * 0.15) * Math.sin(y * 0.12) * 0.5;
      const v = Math.round(128 + n * 24);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  for (let i = 0; i < 120; i++) {
    const x = ((i * 37 + 13) % size) + (i % 2) * 0.5;
    const y = ((i * 53 + 7) % size) + (i % 3) * 0.3;
    const r = 1 + (i % 2);
    const a = 0.015 + (i % 4) * 0.008;
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  return tex;
}
