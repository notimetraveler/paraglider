/**
 * Lighting, sky and atmosphere configuration for alpine FPV scene.
 * Single source of truth for fog, sky gradient and directional lighting.
 * Kept as pure data for testability and ART_DIRECTION alignment.
 */

/** Sky gradient: zenith (top) and horizon (bottom) — light, blue alpine sky */
export const SKY_GRADIENT = {
  zenith: 0x7eb8e8,
  horizon: 0xc8e4f8,
} as const;

/** Linear fog: near/far in world units; color matches horizon for depth */
export const FOG_CONFIG = {
  color: 0xb8dcf0,
  near: 420,
  far: 2500,
} as const;

/** Hemisphere: sky (up) and ground (bounce) — lighter, bluer */
export const HEMISPHERE_CONFIG = {
  skyColor: 0xb0d8f0,
  groundColor: 0x5e8248,
  intensity: 0.72,
} as const;

/** Main sun: bright daylight */
export const SUN_CONFIG = {
  color: 0xfffaf0,
  intensity: 0.98,
  position: { x: 140, y: 240, z: 90 },
} as const;

/** Fill light (shadow side) */
export const FILL_CONFIG = {
  color: 0xd4e8f8,
  intensity: 0.38,
  position: { x: -90, y: 80, z: -70 },
} as const;

/** All atmosphere config - for validation and tests */
export const ATMOSPHERE_CONFIG = {
  sky: SKY_GRADIENT,
  fog: FOG_CONFIG,
  hemisphere: HEMISPHERE_CONFIG,
  sun: SUN_CONFIG,
  fill: FILL_CONFIG,
} as const;

function isHexColor(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 0xffffff;
}

/** Validate config for regressions: fog near < far, colors in range */
export function validateAtmosphereConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (ATMOSPHERE_CONFIG.fog.near >= ATMOSPHERE_CONFIG.fog.far) {
    errors.push("fog.near must be less than fog.far");
  }
  for (const [key, val] of Object.entries(ATMOSPHERE_CONFIG.sky)) {
    if (!isHexColor(val as number)) errors.push(`sky.${key} invalid hex`);
  }
  if (!isHexColor(ATMOSPHERE_CONFIG.fog.color)) errors.push("fog.color invalid hex");
  if (!isHexColor(ATMOSPHERE_CONFIG.hemisphere.skyColor)) errors.push("hemisphere.skyColor invalid hex");
  if (!isHexColor(ATMOSPHERE_CONFIG.hemisphere.groundColor)) errors.push("hemisphere.groundColor invalid hex");
  if (!isHexColor(ATMOSPHERE_CONFIG.sun.color)) errors.push("sun.color invalid hex");
  if (!isHexColor(ATMOSPHERE_CONFIG.fill.color)) errors.push("fill.color invalid hex");
  return { valid: errors.length === 0, errors };
}
