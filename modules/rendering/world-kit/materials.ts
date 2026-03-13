/**
 * World kit - shared alpine materials for foliage, rocks, water.
 * Texture-driven: uses procedural (or future image) textures; single source for stylized-realistic look.
 */

import * as THREE from "three";
import {
  getBarkTexture,
  getFoliageTexture,
  getRockTexture,
  getWaterTexture,
  getShoreTexture,
} from "./texture-cache";

/** Bark - conifer trunk; texture-driven with base tint */
export function createBarkMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map: getBarkTexture(),
    color: 0xffffff,
  });
}

/** Foliage - alpine conifer green; texture-driven */
export function createFoliageMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map: getFoliageTexture(),
    color: 0xffffff,
  });
}

/** Rock - ridge/landmark; texture-driven */
export function createRockMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map: getRockTexture(),
    color: 0xffffff,
  });
}

/** Water surface - valley lake/side basin; texture-driven */
export function createWaterMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map: getWaterTexture(),
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
}

/** Shore - transition water to grass; texture-driven */
export function createShoreMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map: getShoreTexture(),
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
}
