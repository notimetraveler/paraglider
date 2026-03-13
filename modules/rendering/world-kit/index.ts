/**
 * World kit - asset-driven / reusable geometry and materials for alpine world.
 * Use this for foliage, rocks, water and future terrain/asset upgrades.
 * Textures: procedural by default; pipeline ready for image assets via asset-paths.
 */

export { WORLD_ASSETS_BASE, WORLD_ASSET_PATHS } from "./asset-paths";
export type { TerrainTextureKey, BarkTextureKey, FoliageTextureKey, RockTextureKey, WaterTextureKey } from "./asset-paths";

export {
  getTerrainDetailTexture,
  getTerrainBiomeTexture,
  getBarkTexture,
  getFoliageTexture,
  getRockTexture,
  getWaterTexture,
  getShoreTexture,
  loadWorldTextures,
} from "./texture-cache";

export {
  createBarkMaterial,
  createFoliageMaterial,
  createRockMaterial,
  createWaterMaterial,
  createShoreMaterial,
} from "./materials";

export {
  createTreeSlim,
  createTreeFull,
  getTreeVariantIndex,
  createTreeFromKit,
} from "./foliage";

export {
  createRockRounded,
  createRockBlocky,
  getRockVariantIndex,
  createRockFromKit,
} from "./rocks";

export { createWaterSurface } from "./water";
