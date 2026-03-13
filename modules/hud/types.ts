/** HUD display data - derived from simulation state */
export interface HudData {
  airspeed: number;
  altitude: number;
  verticalSpeed: number;
  heading: number;
  state: string;
  /** Wind vector (m/s) - for wind indicator */
  windX: number;
  windZ: number;
  /** Thermal lift at current position (m/s) */
  thermalLift: number;
  /** Horizontal distance to LZ center (m) - shown when approaching */
  distanceToLz?: number;
  /** Gate progress - passed count and total */
  gateProgress?: { passed: number; total: number };
  /** True when in flare zone (low, approaching ground) */
  inFlareZone?: boolean;
}

/** Smoothed control inputs for debug display */
export interface HudInputDebug {
  steerLeft: number;
  steerRight: number;
  brake: number;
  acceleratedFlight: number;
}

/** Environment debug - wind and lift at current position */
export interface HudEnvDebug {
  windX: number;
  windZ: number;
  thermalLift: number;
}

/** Tuning debug - key flight params for realism verification */
export interface HudTuningDebug {
  sinkTrim: number;
  bankDeg: number;
  inFlareZone: boolean;
  worldX?: number;
  worldY?: number;
  worldZ?: number;
  /** Ground height at current position (m) - for collision verification */
  groundAt?: number;
  /** Height above ground (m) */
  heightAboveGround?: number;
  collisionState?: "airborne" | "contact";
}
