/**
 * Scene decor - grounded world composition from world kit.
 * Uses asset-driven / reusable geometry and materials.
 */

import * as THREE from "three";
import { getWorldObjects } from "@/modules/world/obstacles";
import {
  createTreeFromKit,
  getTreeVariantIndex,
  createRockFromKit,
  getRockVariantIndex,
  createWaterSurface,
} from "@/modules/rendering/world-kit";

export function addWorldDecorToScene(scene: THREE.Scene): void {
  for (const object of getWorldObjects()) {
    if (object.kind === "tree") {
      const variant = getTreeVariantIndex(object.id);
      const tree = createTreeFromKit(object.scale, variant);
      tree.position.set(object.x, object.y, object.z);
      tree.rotation.y = object.rotationY;
      scene.add(tree);
      continue;
    }

    if (object.kind === "rock") {
      const variant = getRockVariantIndex(object.id);
      const rock = createRockFromKit(object.scale, object.rotationY, variant);
      rock.position.set(object.x, object.y, object.z);
      scene.add(rock);
      continue;
    }

    if (object.kind === "water") {
      const water = createWaterSurface(
        object.radiusX ?? 30,
        object.radiusZ ?? 24
      );
      water.position.set(object.x, object.y, object.z);
      scene.add(water);
    }
  }
}
