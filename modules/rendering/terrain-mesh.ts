/**
 * Terrain mesh - stylized alpine terrain with height/slope-based materials.
 */

import * as THREE from "three";
import type { TerrainHeightFn } from "@/modules/world/terrain";
import {
  getMountainTerrainHeight,
  getTerrainBiome,
} from "@/modules/world/terrain";

/** Terrain extent (m) - covers flight path */
const TERRAIN_MIN_X = -250;
const TERRAIN_MAX_X = 450;
const TERRAIN_MIN_Z = -150;
const TERRAIN_MAX_Z = 450;

/** Grid resolution */
const TERRAIN_SEGMENTS = 70;

/** Alpine color palette - stylized realistic */
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

/** Get vertex color from biome and slope */
function getBiomeColor(
  x: number,
  z: number,
  height: number,
  slope: number
): THREE.Color {
  const biome = getTerrainBiome(x, z);
  const sunFactor = 0.92 + slope * 0.08;
  const elevFactor = Math.min(1, height / 80) * 0.1 + 0.9;

  let base: THREE.Color;
  let light: THREE.Color;
  switch (biome) {
    case "grass":
      base = COLORS.grass;
      light = COLORS.grassLight;
      break;
    case "earth":
      base = COLORS.earth;
      light = COLORS.earthLight;
      break;
    case "rock":
      base = COLORS.rock;
      light = COLORS.rockLight;
      break;
    case "scree":
      base = COLORS.scree;
      light = COLORS.screeLight;
      break;
    default:
      base = COLORS.grass;
      light = COLORS.grassLight;
  }

  const color = base.clone().lerp(light, sunFactor * elevFactor * 0.4);
  return color;
}

/** Create terrain mesh with vertex colors for biome styling */
export function createTerrainMesh(
  getHeight: TerrainHeightFn = getMountainTerrainHeight
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
    const worldX = TERRAIN_MIN_X + (localX + width / 2);
    const worldZ = TERRAIN_MIN_Z + (localY + depth / 2);
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

    const color = getBiomeColor(worldX, worldZ, height, slope);
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

/** Subtle organic detail texture - multiplies with vertex colors */
function createTerrainDetailTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, "rgba(255,255,255,0.15)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.05)");
  grad.addColorStop(1, "rgba(200,200,200,0.02)");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 200; i++) {
    const x = (i * 37 + 13) % size;
    const y = (i * 53 + 7) % size;
    const r = 1 + (i % 3);
    ctx.fillStyle = `rgba(0,0,0,${0.02 + (i % 5) * 0.01})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}
