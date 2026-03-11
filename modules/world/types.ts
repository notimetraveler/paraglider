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

/** Environment state - wind and lift zones */
export interface Environment {
  wind: WindVector;
  thermals: ThermalZone[];
}
