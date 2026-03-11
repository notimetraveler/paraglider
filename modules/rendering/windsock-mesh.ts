/**
 * Windsock mesh - wind direction indicator at landing zone.
 * Stylized but readable from the air.
 */

import * as THREE from "three";
import { getWindsockHeading } from "@/modules/world/windsock";
import type { WindVector } from "@/modules/world/types";
import { getMountainTerrainHeight } from "@/modules/world/terrain";

/** Create windsock mesh at (x, z) with given wind */
export function createWindsockMesh(
  x: number,
  z: number,
  wind: WindVector
): THREE.Group {
  const group = new THREE.Group();
  const groundY = getMountainTerrainHeight(x, z);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 4.5, 8),
    new THREE.MeshLambertMaterial({ color: 0x3a3a38 })
  );
  pole.position.set(0, 2.25, 0);
  group.add(pole);

  const sock = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 1.4, 8),
    new THREE.MeshLambertMaterial({ color: 0xd45010 })
  );
  sock.position.set(0, 4.5, 0);
  sock.rotation.x = Math.PI / 2;
  group.add(sock);

  const heading = getWindsockHeading(wind);
  group.rotation.y = -heading;
  group.position.set(x, groundY, z);
  return group;
}
