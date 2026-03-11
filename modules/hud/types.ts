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
