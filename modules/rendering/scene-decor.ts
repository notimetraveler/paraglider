/**
 * Scene decor - water, trees, natural landmarks.
 * Stylized alpine aesthetic, biome-aware placement.
 */

import * as THREE from "three";
import {
  getMountainTerrainHeight,
  canPlaceTree,
} from "@/modules/world/terrain";

/** Seeded random for deterministic placement */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Tree cluster positions - valley grass biomes only, deterministic */
function getTreePositions(): Array<{ x: number; z: number; scale: number; rot: number }> {
  const out: Array<{ x: number; z: number; scale: number; rot: number }> = [];
  const clusters: [number, number, number][] = [
    [135, 185, 5],
    [165, 230, 4],
    [145, 250, 3],
    [115, 210, 4],
    [180, 200, 3],
    [125, 155, 4],
    [155, 165, 3],
    [95, 195, 3],
    [175, 270, 4],
    [105, 235, 3],
  ];

  let idx = 0;
  for (const [cx, cz, count] of clusters) {
    for (let i = 0; i < count; i++) {
      const angle = seededRandom(idx * 7 + 1) * Math.PI * 2;
      const dist = 4 + seededRandom(idx * 11 + 2) * 12;
      const x = cx + Math.cos(angle) * dist;
      const z = cz + Math.sin(angle) * dist;
      if (canPlaceTree(x, z)) {
        const scale = 0.7 + seededRandom(idx * 13 + 3) * 0.5;
        const rot = seededRandom(idx * 17 + 4) * Math.PI * 2;
        out.push({ x, z, scale, rot });
      }
      idx++;
    }
  }
  return out;
}

/** Create tree mesh - cone + trunk, alpine conifer style */
function createTreeMesh(scale: number): THREE.Group {
  const group = new THREE.Group();
  const trunkH = 2.5 * scale;
  const trunkR = 0.25 * scale;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 1.2, trunkR * 1.5, trunkH, 6),
    new THREE.MeshLambertMaterial({ color: 0x3d2e24 })
  );
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  const foliageR = 2.2 * scale;
  const foliageH = 5 * scale;
  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(foliageR, foliageH, 8),
    new THREE.MeshLambertMaterial({ color: 0x2d4a2a })
  );
  foliage.position.y = trunkH + foliageH / 2;
  group.add(foliage);
  return group;
}

/** Add trees to scene - clustered, biome-aware */
export function addTreesToScene(scene: THREE.Scene): void {
  const positions = getTreePositions();
  for (const { x, z, scale, rot } of positions) {
    const tree = createTreeMesh(scale);
    const y = getMountainTerrainHeight(x, z);
    tree.position.set(x, y, z);
    tree.rotation.y = rot;
    scene.add(tree);
  }
}

/** Lake center and extent for placement */
const LAKE_CENTER_X = 118;
const LAKE_CENTER_Z = 168;
const LAKE_RADIUS_X = 38;
const LAKE_RADIUS_Z = 32;

/** Create lake - elliptical, valley depression, soft shoreline */
export function createWaterMesh(): THREE.Group {
  const group = new THREE.Group();
  const groundY = getMountainTerrainHeight(LAKE_CENTER_X, LAKE_CENTER_Z);

  const lakeGeom = new THREE.RingGeometry(0.3, 1, 48);
  const lakeMat = new THREE.MeshLambertMaterial({
    color: 0x2a5a7a,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
  const lake = new THREE.Mesh(lakeGeom, lakeMat);
  lake.rotation.x = -Math.PI / 2;
  lake.scale.set(LAKE_RADIUS_X, LAKE_RADIUS_Z, 1);
  lake.position.set(LAKE_CENTER_X, groundY + 0.3, LAKE_CENTER_Z);
  group.add(lake);

  const shoreGeom = new THREE.RingGeometry(0.92, 1.02, 48);
  const shoreMat = new THREE.MeshLambertMaterial({
    color: 0x4a6b3a,
    side: THREE.DoubleSide,
  });
  const shore = new THREE.Mesh(shoreGeom, shoreMat);
  shore.rotation.x = -Math.PI / 2;
  shore.scale.set(LAKE_RADIUS_X, LAKE_RADIUS_Z, 1);
  shore.position.set(LAKE_CENTER_X, groundY + 0.02, LAKE_CENTER_Z);
  group.add(shore);

  return group;
}

/** Rock formation - natural landmark for orientation */
export function createRockLandmark(
  x: number,
  z: number,
  scale: number
): THREE.Group {
  const group = new THREE.Group();
  const y = getMountainTerrainHeight(x, z);
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(scale, 0),
    new THREE.MeshLambertMaterial({ color: 0x5a5a52 })
  );
  rock.position.set(0, scale * 0.6, 0);
  rock.rotation.set(
    Math.PI * 0.1,
    Math.PI * 0.2,
    Math.PI * 0.05
  );
  group.add(rock);
  group.position.set(x, y, z);
  return group;
}
