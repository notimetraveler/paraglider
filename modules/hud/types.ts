/** HUD display data - derived from simulation state */
export interface HudData {
  airspeed: number;
  altitude: number;
  verticalSpeed: number;
  heading: number;
  state: string;
}

/** Smoothed control inputs for debug display */
export interface HudInputDebug {
  steerLeft: number;
  steerRight: number;
  brake: number;
  acceleratedFlight: number;
}
