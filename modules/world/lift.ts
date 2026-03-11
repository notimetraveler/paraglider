/**
 * Lift zone sampling - deterministic, no randomness.
 * Pure functions for testability.
 */

import type { ThermalZone } from "./types";

/**
 * Sample thermal uplift at position (x, z).
 * Zeer zachte falloff: directe lift zodra je in de zuil bent.
 * (1-r)^0.5 = meer lift aan de rand, snelle respons bij binnenkomen.
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
      const falloff = Math.sqrt(Math.max(0, 1 - r));
      total += t.strength * falloff;
    }
  }
  return total;
}
