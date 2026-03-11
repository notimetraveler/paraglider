/**
 * Pure formatting functions for HUD display.
 * All values use SI units internally; formatters produce human-readable strings.
 */

/** Format airspeed (m/s) as "XX.X" */
export function formatSpeed(airspeed: number): string {
  return airspeed.toFixed(1);
}

/** Format altitude (m) as integer */
export function formatAltitude(altitude: number): string {
  return Math.round(altitude).toString();
}

/** Format vertical speed (m/s, positive=climb) as "±X.X" */
export function formatVerticalSpeed(verticalSpeed: number): string {
  const sign = verticalSpeed >= 0 ? "+" : "";
  return `${sign}${verticalSpeed.toFixed(1)}`;
}

/** Format heading (radians) as degrees 0–359 */
export function formatHeading(heading: number): string {
  const deg = (heading * (180 / Math.PI) + 360) % 360;
  return Math.round(deg).toString();
}

/** Format heading for compass display (e.g. "N", "NE", "270°") */
export function formatHeadingCompass(heading: number): string {
  const deg = (heading * (180 / Math.PI) + 360) % 360;
  const rounded = Math.round(deg);
  const labels: Record<number, string> = {
    0: "N",
    90: "E",
    180: "S",
    270: "W",
  };
  return labels[rounded] ?? `${rounded}°`;
}
