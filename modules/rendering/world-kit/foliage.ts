/**
 * World kit - alpine tree variants.
 * Reusable geometry one step above raw primitives; consistent with art direction.
 */

import * as THREE from "three";
import { createBarkMaterial, createFoliageMaterial } from "./materials";

/** Slim conifer: single cone, taller ratio */
export function createTreeSlim(scale: number): THREE.Group {
  const group = new THREE.Group();
  const trunkH = 2.6 * scale;
  const trunkR = 0.22 * scale;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 1.15, trunkR * 1.45, trunkH, 8),
    createBarkMaterial()
  );
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  const foliageR = 1.9 * scale;
  const foliageH = 5.2 * scale;
  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(foliageR, foliageH, 12),
    createFoliageMaterial()
  );
  foliage.position.y = trunkH + foliageH / 2;
  group.add(foliage);
  return group;
}

/** Full conifer: slightly wider base cone, bushier silhouette */
export function createTreeFull(scale: number): THREE.Group {
  const group = new THREE.Group();
  const trunkH = 2.4 * scale;
  const trunkR = 0.26 * scale;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 1.2, trunkR * 1.5, trunkH, 8),
    createBarkMaterial()
  );
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  const foliageR = 2.3 * scale;
  const foliageH = 5 * scale;
  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(foliageR, foliageH, 12),
    createFoliageMaterial()
  );
  foliage.position.y = trunkH + foliageH / 2;
  group.add(foliage);
  return group;
}

/** Pick tree variant by stable hash of id string (0 or 1) */
export function getTreeVariantIndex(id: string): 0 | 1 {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 2) as 0 | 1;
}

export function createTreeFromKit(scale: number, variantIndex: 0 | 1): THREE.Group {
  return variantIndex === 0 ? createTreeSlim(scale) : createTreeFull(scale);
}
