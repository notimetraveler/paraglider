/**
 * World kit - alpine rock / landmark variants.
 * Reusable shapes a step above raw primitives; consistent with art direction.
 */

import * as THREE from "three";
import { createRockMaterial } from "./materials";

/** Rounded rock - icosahedron with subdivision for softer silhouette */
export function createRockRounded(scale: number, rotationY: number): THREE.Group {
  const group = new THREE.Group();
  const geom = new THREE.IcosahedronGeometry(scale, 1);
  const mesh = new THREE.Mesh(geom, createRockMaterial());
  mesh.position.set(0, scale * 0.55, 0);
  mesh.rotation.set(Math.PI * 0.08, rotationY, Math.PI * 0.04);
  group.add(mesh);
  return group;
}

/** Blocky outcrop - dodecahedron with subdivision for less perfect shape */
export function createRockBlocky(scale: number, rotationY: number): THREE.Group {
  const group = new THREE.Group();
  const geom = new THREE.DodecahedronGeometry(scale, 1);
  const mesh = new THREE.Mesh(geom, createRockMaterial());
  mesh.position.set(0, scale * 0.6, 0);
  mesh.rotation.set(Math.PI * 0.12, rotationY, Math.PI * 0.06);
  group.add(mesh);
  return group;
}

/** Pick rock variant by stable hash of id (0 or 1) */
export function getRockVariantIndex(id: string): 0 | 1 {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 2) as 0 | 1;
}

export function createRockFromKit(
  scale: number,
  rotationY: number,
  variantIndex: 0 | 1
): THREE.Group {
  return variantIndex === 0
    ? createRockRounded(scale, rotationY)
    : createRockBlocky(scale, rotationY);
}
