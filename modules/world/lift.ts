/**
 * Lift zone sampling - deterministic, no randomness.
 * Pure functions for testability.
 */

import type { ThermalZone, RidgeLiftZone, WindVector } from "./types";

/** Soft edge: lift extends to 1.15x radius with linear falloff - learnable, forgiving */
const THERMAL_SOFT_EDGE_FACTOR = 1.15;

/**
 * Sample thermal uplift at position (x, z).
 * Core: sqrt(1-r) falloff. Soft edge: r 1.0..1.15 linear to 0 - geen harde rand.
 */
export function getThermalLift(
  x: number,
  z: number,
  thermals: ThermalZone[]
): number {
  let total = 0;
  for (const t of thermals) {
    const dx = x - t.x;
    const dz = z - t.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const r = dist / t.radius;
    if (r < 1) {
      const falloff = Math.sqrt(Math.max(0, 1 - r));
      total += t.strength * falloff;
    } else if (r < THERMAL_SOFT_EDGE_FACTOR) {
      const soft = (THERMAL_SOFT_EDGE_FACTOR - r) / (THERMAL_SOFT_EDGE_FACTOR - 1);
      total += t.strength * soft * 0.3;
    }
  }
  return total;
}

/**
 * Sample ridge lift at position (x, z).
 * Lift when wind has component perpendicular to ridge (wind crosses ridge).
 * Distance from ridge line must be within width. Deterministic.
 */
export function getRidgeLift(
  x: number,
  z: number,
  ridges: RidgeLiftZone[],
  wind: WindVector
): number {
  const windSpeed = Math.sqrt(wind.x * wind.x + wind.z * wind.z);
  if (windSpeed < 0.5) return 0;

  let total = 0;
  for (const r of ridges) {
    const ridgeDx = r.x2 - r.x1;
    const ridgeDz = r.z2 - r.z1;
    const ridgeLen = Math.sqrt(ridgeDx * ridgeDx + ridgeDz * ridgeDz);
    if (ridgeLen < 1) continue;

    const perpX = -ridgeDz / ridgeLen;
    const perpZ = ridgeDx / ridgeLen;
    const windPerp = Math.abs(wind.x * perpX + wind.z * perpZ);
    if (windPerp < 0.5) continue;

    const t = Math.max(
      0,
      Math.min(
        1,
        ((x - r.x1) * ridgeDx + (z - r.z1) * ridgeDz) / (ridgeLen * ridgeLen)
      )
    );
    const projX = r.x1 + t * ridgeDx;
    const projZ = r.z1 + t * ridgeDz;
    const dist = Math.sqrt((x - projX) ** 2 + (z - projZ) ** 2);
    if (dist > r.width) continue;

    const windFactor = windPerp / windSpeed;
    const distFactor = Math.max(0, 1 - dist / r.width);
    total += r.strength * windFactor * distFactor;
  }
  return total;
}
