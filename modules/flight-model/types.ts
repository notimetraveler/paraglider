/** Flight state enum - lifecycle of a paraglider session */
export type FlightState = "ready" | "launch" | "airborne" | "landed" | "crashed" | "reset";

/** 3D vector */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Pilot control inputs - maps from input layer */
export interface PilotInputs {
  /** Left steering (0..1) */
  steerLeft: number;
  /** Right steering (0..1) */
  steerRight: number;
  /** Brake input - both toggles pulled (0..1) */
  brake: number;
  /** Accelerated flight / speed bar (0..1) */
  acceleratedFlight: number;
}
