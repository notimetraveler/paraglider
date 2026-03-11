/**
 * Centralized flight tuning parameters.
 * All values documented for realism tuning.
 */

/** Fixed sim timestep (s) */
export const SIM_DT = 1 / 60;

// --- Speed & polar ---
/** Trim speed (m/s) - typical paraglider 22-28 km/h */
export const TRIM_SPEED = 8;
/** Min speed (m/s) - below this wing stalls */
export const MIN_SPEED = 2;
/** Brake: speed factor at full brake (0.45 = 45% of trim) */
export const BRAKE_SPEED_FACTOR = 0.45;
/** Accelerated flight: max speed factor */
export const ACCEL_SPEED_FACTOR = 1.45;

// --- Sink rates (m/s) - paraglider polar ---
/** Sink at trim - real PG ~1.2-1.4 */
export const SINK_AT_TRIM = 1.25;
/** Sink at full brake - best glide, less sink */
export const SINK_AT_FULL_BRAKE = 0.65;
/** Sink at full speed bar - faster but worse L/D */
export const SINK_AT_FULL_ACCEL = 2.6;

// --- Bank & turn ---
/** Max bank (rad) - paraglider typical ~35° */
export const MAX_BANK = (35 * Math.PI) / 180;
/** Bank build rate (rad/s) - wing inertia, slower = more PG feel */
export const BANK_RATE_UP = 0.95;
/** Bank decay rate (rad/s) - wing levels when released */
export const BANK_RATE_DOWN = 1.4;
/** Extra sink per radian bank - turn energy loss */
export const BANK_SINK_FACTOR = 0.22;

// --- Pitch attitude (brake/accel visual) ---
/** Max pitch (rad) - brake=horizon up, accel=horizon down */
export const MAX_PITCH_ATTITUDE = (10 * Math.PI) / 180;
export const PITCH_ATTITUDE_RATE_UP = 1.1;
export const PITCH_ATTITUDE_RATE_DOWN = 1.5;

// --- Vertical speed blend (thermal response) - hoog = directe respons ---
export const VERTICAL_SPEED_BLEND_RATE = 80;

// --- Flare & landing ---
/** Altitude (m) below which flare is effective */
export const FLARE_ALTITUDE = 4;
/** Brake threshold for flare (0-1) */
export const FLARE_BRAKE_THRESHOLD = 0.4;
/** Extra sink reduction when flaring (m/s) */
export const FLARE_SINK_REDUCTION = 0.5;

// --- Near-stall (optional realism) ---
/** Brake level above which sink increases (stall tendency) */
export const STALL_BRAKE_THRESHOLD = 0.92;
/** Extra sink when over-braking (m/s) */
export const STALL_SINK_PENALTY = 0.4;

// --- Input smoothing (used by SimulatorShell) ---
/** Brake/accel ramp rate (1/s) */
export const BRAKE_ACCEL_RAMP_RATE = 0.8;
/** Steer ramp up (1/s) */
export const STEER_RAMP_UP = 0.7;
/** Steer ramp down (1/s) */
export const STEER_RAMP_DOWN = 0.5;
