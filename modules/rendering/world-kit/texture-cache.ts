/**
 * World kit - cached textures for materials.
 * Tries to load from WORLD_ASSET_PATHS first; falls back to procedural on missing/error.
 * Call loadWorldTextures() before creating the scene to use image assets when present.
 */

import * as THREE from "three";
import type { TerrainTextureKey } from "./asset-paths";
import { WORLD_ASSET_PATHS } from "./asset-paths";
import {
  createProceduralGrassTexture,
  createProceduralEarthTexture,
  createProceduralRockTexture,
  createProceduralScreeTexture,
  createProceduralTerrainDetailTexture,
  createProceduralBarkTexture,
  createProceduralFoliageTexture,
  createProceduralRockDefaultTexture,
  createProceduralWaterTexture,
  createProceduralShoreTexture,
} from "./procedural-textures";

const terrainCache = new Map<TerrainTextureKey, THREE.Texture>();
const barkCache = new Map<string, THREE.Texture>();
const foliageCache = new Map<string, THREE.Texture>();
const rockCache = new Map<string, THREE.Texture>();
const waterCache = new Map<string, THREE.Texture>();

function applyRepeatWrap(tex: THREE.Texture): void {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
}

/**
 * Preload world textures from asset paths; on 404/error use procedural.
 * Resolve when all attempts have finished. Call before createFpvScene for asset-driven visuals.
 * In test env (VITEST) skips network and fills cache with procedural so tests resolve immediately.
 */
export function loadWorldTextures(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (typeof process !== "undefined" && process.env?.VITEST === "true") {
    terrainCache.set("detail", createProceduralTerrainDetailTexture());
    terrainCache.set("grass", createProceduralGrassTexture());
    terrainCache.set("earth", createProceduralEarthTexture());
    terrainCache.set("rock", createProceduralRockTexture());
    terrainCache.set("scree", createProceduralScreeTexture());
    barkCache.set("default", createProceduralBarkTexture());
    foliageCache.set("default", createProceduralFoliageTexture());
    rockCache.set("default", createProceduralRockDefaultTexture());
    waterCache.set("surface", createProceduralWaterTexture());
    waterCache.set("shore", createProceduralShoreTexture());
    return Promise.resolve();
  }

  const loader = new THREE.TextureLoader();
  const promises: Promise<void>[] = [];

  const loadOrProcedural = (
    url: string,
    procedural: () => THREE.Texture,
    setCache: (t: THREE.Texture) => void
  ): Promise<void> =>
    new Promise((resolve) => {
      loader.load(
        url,
        (tex) => {
          applyRepeatWrap(tex);
          setCache(tex);
          resolve();
        },
        undefined,
        () => {
          setCache(procedural());
          resolve();
        }
      );
    });

  const setTerrain = (k: TerrainTextureKey) => (t: THREE.Texture) => terrainCache.set(k, t);
  const setBark = (t: THREE.Texture) => barkCache.set("default", t);
  const setFoliage = (t: THREE.Texture) => foliageCache.set("default", t);
  const setRock = (t: THREE.Texture) => rockCache.set("default", t);
  const setWaterSurface = (t: THREE.Texture) => waterCache.set("surface", t);
  const setWaterShore = (t: THREE.Texture) => waterCache.set("shore", t);

  promises.push(
    loadOrProcedural(
      WORLD_ASSET_PATHS.terrain.detail,
      createProceduralTerrainDetailTexture,
      (t) => {
        setTerrain("detail")(t);
        if ("repeat" in t) t.repeat.set(14, 14);
      }
    )
  );
  promises.push(
    loadOrProcedural(WORLD_ASSET_PATHS.terrain.grass, createProceduralGrassTexture, setTerrain("grass"))
  );
  promises.push(
    loadOrProcedural(WORLD_ASSET_PATHS.terrain.earth, createProceduralEarthTexture, setTerrain("earth"))
  );
  promises.push(
    loadOrProcedural(WORLD_ASSET_PATHS.terrain.rock, createProceduralRockTexture, setTerrain("rock"))
  );
  promises.push(
    loadOrProcedural(WORLD_ASSET_PATHS.terrain.scree, createProceduralScreeTexture, setTerrain("scree"))
  );
  promises.push(
    loadOrProcedural(WORLD_ASSET_PATHS.bark.default, createProceduralBarkTexture, setBark)
  );
  promises.push(
    loadOrProcedural(WORLD_ASSET_PATHS.foliage.default, createProceduralFoliageTexture, setFoliage)
  );
  promises.push(
    loadOrProcedural(WORLD_ASSET_PATHS.rock.default, createProceduralRockDefaultTexture, setRock)
  );
  promises.push(
    loadOrProcedural(WORLD_ASSET_PATHS.water.surface, createProceduralWaterTexture, setWaterSurface)
  );
  promises.push(
    loadOrProcedural(WORLD_ASSET_PATHS.water.shore, createProceduralShoreTexture, setWaterShore)
  );

  return Promise.all(promises).then(() => {});
}

function getTerrainTexture(key: TerrainTextureKey): THREE.Texture {
  let tex = terrainCache.get(key);
  if (!tex) {
    switch (key) {
      case "grass":
        tex = createProceduralGrassTexture();
        break;
      case "earth":
        tex = createProceduralEarthTexture();
        break;
      case "rock":
        tex = createProceduralRockTexture();
        break;
      case "scree":
        tex = createProceduralScreeTexture();
        break;
      case "detail":
        tex = createProceduralTerrainDetailTexture();
        break;
      default:
        tex = createProceduralTerrainDetailTexture();
    }
    terrainCache.set(key, tex);
  }
  return tex;
}

/** Terrain detail texture for vertex-color blending (tiling repeat) */
export function getTerrainDetailTexture(): THREE.Texture {
  return getTerrainTexture("detail");
}

/** Terrain biome textures (grass, earth, rock, scree) - for future multi-texture terrain */
export function getTerrainBiomeTexture(key: TerrainTextureKey): THREE.Texture {
  return getTerrainTexture(key);
}

export function getBarkTexture(): THREE.Texture {
  let tex = barkCache.get("default");
  if (!tex) {
    tex = createProceduralBarkTexture();
    barkCache.set("default", tex);
  }
  return tex;
}

export function getFoliageTexture(): THREE.Texture {
  let tex = foliageCache.get("default");
  if (!tex) {
    tex = createProceduralFoliageTexture();
    foliageCache.set("default", tex);
  }
  return tex;
}

export function getRockTexture(): THREE.Texture {
  let tex = rockCache.get("default");
  if (!tex) {
    tex = createProceduralRockDefaultTexture();
    rockCache.set("default", tex);
  }
  return tex;
}

export function getWaterTexture(): THREE.Texture {
  let tex = waterCache.get("surface");
  if (!tex) {
    tex = createProceduralWaterTexture();
    waterCache.set("surface", tex);
  }
  return tex;
}

export function getShoreTexture(): THREE.Texture {
  let tex = waterCache.get("shore");
  if (!tex) {
    tex = createProceduralShoreTexture();
    waterCache.set("shore", tex);
  }
  return tex;
}
