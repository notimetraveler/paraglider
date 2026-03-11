/**
 * Windsock direction helper - converts wind vector to visual orientation.
 * Wind blows FROM its direction; windsock points DOWNwind (where wind goes).
 */

import type { WindVector } from "./types";

/**
 * Get windsock heading (radians) - direction the sock points.
 * Windsock points downwind: opposite to wind direction.
 * Wind from west (negative x) -> sock points east (positive x).
 * Returns angle in radians, 0 = +Z (north), PI/2 = +X (east).
 */
export function getWindsockHeading(wind: WindVector): number {
  const speed = Math.sqrt(wind.x * wind.x + wind.z * wind.z);
  if (speed < 0.1) {
    return 0; // No wind -> default north
  }
  // Wind blows FROM (wind.x, wind.z) direction
  // Sock points DOWNwind = opposite direction
  const downwindX = -wind.x;
  const downwindZ = -wind.z;
  return Math.atan2(downwindX, downwindZ);
}
