import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  createTreeSlim,
  createTreeFull,
  getTreeVariantIndex,
  createTreeFromKit,
  createRockRounded,
  createRockBlocky,
  getRockVariantIndex,
  createRockFromKit,
  createWaterSurface,
  createBarkMaterial,
  createRockMaterial,
  createFoliageMaterial,
  createWaterMaterial,
  createShoreMaterial,
  getTerrainDetailTexture,
  getBarkTexture,
  getFoliageTexture,
  getRockTexture,
  getWaterTexture,
  getShoreTexture,
  loadWorldTextures,
  WORLD_ASSETS_BASE,
  WORLD_ASSET_PATHS,
} from "@/modules/rendering/world-kit";

describe("world-kit", () => {
  it("exports tree variants that return Group with trunk and foliage", () => {
    const slim = createTreeSlim(1);
    const full = createTreeFull(1);
    expect(slim).toBeInstanceOf(THREE.Group);
    expect(full).toBeInstanceOf(THREE.Group);
    expect(slim.children.length).toBe(2);
    expect(full.children.length).toBe(2);
  });

  it("getTreeVariantIndex returns 0 or 1 deterministically", () => {
    expect([0, 1]).toContain(getTreeVariantIndex("tree-west-forest-1-0"));
    expect(getTreeVariantIndex("a")).toBe(getTreeVariantIndex("a"));
    expect(getTreeVariantIndex("b")).toBe(getTreeVariantIndex("b"));
  });

  it("createTreeFromKit returns correct variant by index", () => {
    const t0 = createTreeFromKit(1, 0);
    const t1 = createTreeFromKit(1, 1);
    expect(t0).toBeInstanceOf(THREE.Group);
    expect(t1).toBeInstanceOf(THREE.Group);
    expect(t0.children.length).toBe(2);
    expect(t1.children.length).toBe(2);
  });

  it("exports rock variants that return Group with one mesh", () => {
    const rounded = createRockRounded(5, 0);
    const blocky = createRockBlocky(5, 0);
    expect(rounded).toBeInstanceOf(THREE.Group);
    expect(blocky).toBeInstanceOf(THREE.Group);
    expect(rounded.children.length).toBe(1);
    expect(blocky.children.length).toBe(1);
  });

  it("getRockVariantIndex returns 0 or 1 deterministically", () => {
    expect([0, 1]).toContain(getRockVariantIndex("rock-west-1"));
    expect(getRockVariantIndex("x")).toBe(getRockVariantIndex("x"));
  });

  it("createRockFromKit returns Group at origin for positioning", () => {
    const rock = createRockFromKit(6, Math.PI / 4, 0);
    expect(rock.position.x).toBe(0);
    expect(rock.position.y).toBe(0);
    expect(rock.position.z).toBe(0);
  });

  it("createWaterSurface returns Group with lake and shore", () => {
    const water = createWaterSurface(30, 24);
    expect(water).toBeInstanceOf(THREE.Group);
    expect(water.children.length).toBe(2);
  });

  it("material factories return Lambert materials", () => {
    expect(createBarkMaterial()).toBeInstanceOf(THREE.MeshLambertMaterial);
    expect(createRockMaterial()).toBeInstanceOf(THREE.MeshLambertMaterial);
  });

  it("material factories return texture-driven materials with map", () => {
    expect(createBarkMaterial().map).toBeDefined();
    expect(createFoliageMaterial().map).toBeDefined();
    expect(createRockMaterial().map).toBeDefined();
    expect(createWaterMaterial().map).toBeDefined();
    expect(createShoreMaterial().map).toBeDefined();
  });

  it("texture cache returns a Texture (Canvas or Data placeholder) for world kit", () => {
    expect(getTerrainDetailTexture()).toBeInstanceOf(THREE.Texture);
    expect(getBarkTexture()).toBeInstanceOf(THREE.Texture);
    expect(getFoliageTexture()).toBeInstanceOf(THREE.Texture);
    expect(getRockTexture()).toBeInstanceOf(THREE.Texture);
    expect(getWaterTexture()).toBeInstanceOf(THREE.Texture);
    expect(getShoreTexture()).toBeInstanceOf(THREE.Texture);
  });

  it("terrain detail texture is reused (cached)", () => {
    expect(getTerrainDetailTexture()).toBe(getTerrainDetailTexture());
  });

  it("asset path config has expected structure for terrain, bark, foliage, rock, water", () => {
    expect(WORLD_ASSETS_BASE).toBe("/assets/world");
    expect(WORLD_ASSET_PATHS.terrain.grass).toContain("/terrain/");
    expect(WORLD_ASSET_PATHS.terrain.rock).toContain("/terrain/");
    expect(WORLD_ASSET_PATHS.bark.default).toContain("/bark/");
    expect(WORLD_ASSET_PATHS.foliage.default).toContain("/foliage/");
    expect(WORLD_ASSET_PATHS.rock.default).toContain("/rock/");
    expect(WORLD_ASSET_PATHS.water.surface).toContain("/water/");
    expect(WORLD_ASSET_PATHS.water.shore).toContain("/water/");
  });

  it("loadWorldTextures returns a Promise that resolves", async () => {
    await expect(loadWorldTextures()).resolves.toBeUndefined();
  });

  it("after loadWorldTextures, getBarkTexture still returns a texture", async () => {
    await loadWorldTextures();
    expect(getBarkTexture()).toBeInstanceOf(THREE.Texture);
  });
});
