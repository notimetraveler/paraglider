/** Launch/spawn position */
export interface SpawnPoint {
  x: number;
  y: number;
  z: number;
  heading: number;
}

/** Global wind vector (m/s) - horizontal only */
export interface WindVector {
  x: number;
  z: number;
}

/** Thermal zone - cylindrical uplift */
export interface ThermalZone {
  x: number;
  z: number;
  radius: number;
  strength: number;
}

/** Ridge lift zone - line segment, lift when wind blows toward ridge */
export interface RidgeLiftZone {
  /** Start of ridge line (m) */
  x1: number;
  z1: number;
  /** End of ridge line (m) */
  x2: number;
  z2: number;
  /** Width perpendicular to ridge (m) - how far from line lift applies */
  width: number;
  /** Max lift (m/s) when wind is perpendicular and at full strength */
  strength: number;
}

/** Environment state - wind and lift zones */
export interface Environment {
  wind: WindVector;
  thermals: ThermalZone[];
  ridgeLift: RidgeLiftZone[];
  /** Optional terrain height (m). If not set, uses flat ground at 0. */
  getGroundHeight?: (x: number, z: number) => number;
}
