import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createGateMarkerMesh } from "@/modules/rendering/gate-mesh";

describe("gate marker mesh", () => {
  it("renders gates as vertical markers above terrain instead of flat ground discs", () => {
    const gate = { x: 0, z: 260, radius: 50, order: 1 };
    const mesh = createGateMarkerMesh(gate, () => 32);

    expect(mesh).toBeInstanceOf(THREE.Group);
    expect(mesh.position.x).toBe(0);
    expect(mesh.position.z).toBe(260);
    expect(mesh.position.y).toBe(90);

    const ring = mesh.children[0] as THREE.Mesh;
    expect(ring.geometry).toBeInstanceOf(THREE.RingGeometry);
    expect(ring.rotation.x).toBe(0);
  });
});
