import * as THREE from "three";
import type { LevelGate } from "@/modules/world/level-types";
import { terrainHeightAt, type TerrainHeightFn } from "@/modules/world/terrain";

const GATE_BOTTOM_CLEARANCE = 8;
const GATE_BAND_THICKNESS = 4;

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
    new THREE.MeshBasicMaterial({
      color: 0x40a0c0,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      fog: false,
      depthWrite: false,
    })
  );
  group.add(ring);

  const poleHeight = centerY - groundY;
  const poleMaterial = new THREE.MeshBasicMaterial({
    color: 0x7fd8ff,
    transparent: true,
    opacity: 0.35,
    fog: false,
  });
  const poleGeometry = new THREE.CylinderGeometry(0.25, 0.25, poleHeight, 8);

  for (const side of [-1, 1]) {
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(side * gate.radius * 0.72, -gate.radius / 2, 0);
    group.add(pole);
  }

  group.position.set(gate.x, centerY, gate.z);
  return group;
}
