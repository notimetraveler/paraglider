/**
 * World kit - water surface and shore.
 * Reusable presentation for valley/side basins; consistent materials.
 */

import * as THREE from "three";
import { createWaterMaterial, createShoreMaterial } from "./materials";

/** Full disc water + soft shore ring; kit materials */
export function createWaterSurface(radiusX: number, radiusZ: number): THREE.Group {
  const group = new THREE.Group();
  const lakeGeom = new THREE.CircleGeometry(1, 48);
  const lake = new THREE.Mesh(lakeGeom, createWaterMaterial());
  lake.rotation.x = -Math.PI / 2;
  lake.scale.set(radiusX, radiusZ, 1);
  lake.position.set(0, 0.25, 0);
  group.add(lake);

  const shoreGeom = new THREE.RingGeometry(0.94, 1.06, 48);
  const shore = new THREE.Mesh(shoreGeom, createShoreMaterial());
  shore.rotation.x = -Math.PI / 2;
  shore.scale.set(radiusX, radiusZ, 1);
  shore.position.set(0, 0.02, 0);
  group.add(shore);
  return group;
}
