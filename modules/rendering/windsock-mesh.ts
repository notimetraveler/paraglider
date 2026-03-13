/**
 * Windsock mesh - wind direction indicator at landing zone.
 * Larger, readable sock with streamer (wimpel). Points downwind.
 */

import * as THREE from "three";
import { getWindsockHeading } from "@/modules/world/windsock";
import type { WindVector } from "@/modules/world/types";
import { getMountainTerrainHeight } from "@/modules/world/terrain";

const SCALE = 2.2;

const POLE_HEIGHT = 4.2 * SCALE;
const SOCK_LENGTH = 1.35 * SCALE;
const SOCK_RADIUS = 0.32 * SCALE;
const BASE_RADIUS = 0.4 * SCALE;
const BASE_HEIGHT = 0.12 * SCALE;
const POLE_RADIUS = 0.1 * SCALE;

/** Streamer (wimpel) - ribbon downwind of the sock */
const STREAMER_LENGTH = 2.8 * SCALE;
const STREAMER_WIDTH = 0.5 * SCALE;

/** Create windsock mesh at (x, z) with given wind */
export function createWindsockMesh(
  x: number,
  z: number,
  wind: WindVector
): THREE.Group {
  const group = new THREE.Group();
  const groundY = getMountainTerrainHeight(x, z);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(BASE_RADIUS, BASE_RADIUS * 1.1, BASE_HEIGHT, 12),
    new THREE.MeshLambertMaterial({ color: 0x454540 })
  );
  base.position.set(0, BASE_HEIGHT / 2, 0);
  group.add(base);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS * 1.6, POLE_HEIGHT, 8),
    new THREE.MeshLambertMaterial({ color: 0x404038 })
  );
  pole.position.set(0, BASE_HEIGHT + POLE_HEIGHT / 2, 0);
  group.add(pole);

  const sock = new THREE.Mesh(
    new THREE.ConeGeometry(SOCK_RADIUS, SOCK_LENGTH, 10),
    new THREE.MeshLambertMaterial({ color: 0xc85a20 })
  );
  sock.position.set(0, BASE_HEIGHT + POLE_HEIGHT, 0);
  sock.rotation.x = Math.PI / 2;
  group.add(sock);

  const speed = Math.hypot(wind.x, wind.z);
  const tension = Math.min(1, speed / 8);
  sock.scale.set(1, 0.6 + 0.4 * tension, 1);

  // Streamer (wimpel): flat ribbon extending downwind from sock tip (local -Z)
  const sockTipZ = -SOCK_LENGTH * (0.6 + 0.4 * tension);
  const streamerGeom = new THREE.PlaneGeometry(STREAMER_WIDTH, STREAMER_LENGTH);
  const streamer = new THREE.Mesh(
    streamerGeom,
    new THREE.MeshLambertMaterial({
      color: 0xe86a30,
      side: THREE.DoubleSide,
    })
  );
  streamer.position.set(0, BASE_HEIGHT + POLE_HEIGHT, sockTipZ - STREAMER_LENGTH / 2);
  streamer.rotation.x = -Math.PI / 2;
  group.add(streamer);
  const streamerTension = Math.min(1, speed / 6);
  streamer.scale.set(1, 0.4 + 0.6 * streamerTension, 1);

  // Downwind direction in world (wx, wz). Cone tip is local -Z; rotation.y = θ
  // makes local -Z go to (sin θ, -cos θ). We need (sin θ, -cos θ) = (wx, wz)/|w|
  // => θ = atan2(wx, -wz).
  const downwindYaw = Math.atan2(wind.x, -wind.z);
  group.rotation.y = downwindYaw;
  group.position.set(x, groundY, z);
  return group;
}
