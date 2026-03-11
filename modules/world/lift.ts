/**
 * Lift zone sampling - deterministic, no randomness.
 * Pure functions for testability.
 */

import type { ThermalZone } from "./types";

/**
 * Sample thermal uplift at position (x, z).
 * Zachte falloff: merkbare lift al aan de rand, directe respons.
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
    if (dist < t.radius) {
      const r = dist / t.radius;
      // Softer falloff: 1-r^2 was te scherp aan rand. Nu 1-r voor meer lift aan rand.
      const falloff = Math.max(0, 1 - r);
      total += t.strength * falloff;
    }
  }
  return total;
}
