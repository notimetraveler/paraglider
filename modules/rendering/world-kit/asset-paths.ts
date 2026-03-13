/**
 * World kit - asset path registry for textures and materials.
 * Central place for terrain, bark, foliage, rock, water.
 * Pipeline is future-proof: replace procedural with image paths when assets exist.
 */

/** Base URL for world assets (Next.js public folder) */
export const WORLD_ASSETS_BASE = "/assets/world";

export const WORLD_ASSET_PATHS = {
  terrain: {
    grass: `${WORLD_ASSETS_BASE}/terrain/grass.jpg`,
    earth: `${WORLD_ASSETS_BASE}/terrain/earth.jpg`,
    rock: `${WORLD_ASSETS_BASE}/terrain/rock.jpg`,
    scree: `${WORLD_ASSETS_BASE}/terrain/scree.jpg`,
    detail: `${WORLD_ASSETS_BASE}/terrain/detail.jpg`,
  },
  bark: {
    default: `${WORLD_ASSETS_BASE}/bark/default.png`,
  },
  foliage: {
    default: `${WORLD_ASSETS_BASE}/foliage/default.png`,
  },
  rock: {
    default: `${WORLD_ASSETS_BASE}/rock/default.png`,
  },
  water: {
    surface: `${WORLD_ASSETS_BASE}/water/surface.png`,
    shore: `${WORLD_ASSETS_BASE}/water/shore.png`,
  },
} as const;

export type TerrainTextureKey = keyof typeof WORLD_ASSET_PATHS.terrain;
export type BarkTextureKey = keyof typeof WORLD_ASSET_PATHS.bark;
export type FoliageTextureKey = keyof typeof WORLD_ASSET_PATHS.foliage;
export type RockTextureKey = keyof typeof WORLD_ASSET_PATHS.rock;
export type WaterTextureKey = keyof typeof WORLD_ASSET_PATHS.water;
