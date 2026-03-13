/**
 * Windsock direction helper - converts wind vector to visual orientation.
 * Wind blows FROM its direction; windsock points DOWNwind (where wind goes).
 */

import type { WindVector } from "./types";

/**
 * Get windsock heading (radians) - direction the sock points.
 * Windsock points downwind: where the wind blows TO.
 * Wind (5, 0) = air moves east -> sock points east.
 * Returns angle in radians, 0 = +Z (north), PI/2 = +X (east).
 */
export function getWindsockHeading(wind: WindVector): number {
  const speed = Math.sqrt(wind.x * wind.x + wind.z * wind.z);
  if (speed < 0.1) {
    return 0; // No wind -> default north
  }
  return Math.atan2(wind.x, wind.z);
}
