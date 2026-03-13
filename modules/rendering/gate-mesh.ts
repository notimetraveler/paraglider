import * as THREE from "three";
import type { LevelGate } from "@/modules/world/level-types";
import { terrainHeightAt, type TerrainHeightFn } from "@/modules/world/terrain";

const GATE_BOTTOM_CLEARANCE = 8;
const GATE_BAND_THICKNESS = 4;

/** Alpine-integrated gate: slate blue-grey ring, fog-aware, lit */
const GATE_RING_COLOR = 0x5a6a78;

export function createGateMarkerMesh(
  gate: LevelGate,
  getHeight: TerrainHeightFn = terrainHeightAt
): THREE.Group {
  const group = new THREE.Group();
  const groundY = getHeight(gate.x, gate.z);
  const centerY = groundY + gate.radius + GATE_BOTTOM_CLEARANCE;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(
      Math.max(4, gate.radius - GATE_BAND_THICKNESS),
      gate.radius,
      48
    ),
    new THREE.MeshLambertMaterial({
      color: GATE_RING_COLOR,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
      fog: true,
      depthWrite: true,
    })
  );
  group.add(ring);

  group.position.set(gate.x, centerY, gate.z);
  return group;
}
