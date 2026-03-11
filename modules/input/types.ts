/** Raw keyboard state - which keys are held */
export interface RawInputState {
  left: boolean;
  right: boolean;
  /** Down = brake (both toggles pulled) */
  brake: boolean;
  /** Up = accelerated flight / speed bar */
  acceleratedFlight: boolean;
  /** Camera look: a = look left */
  lookLeft: boolean;
  /** Camera look: d = look right */
  lookRight: boolean;
  /** Camera look: w = look up */
  lookUp: boolean;
  /** Camera look: x = look down */
  lookDown: boolean;
  /** Camera look: s = look forward (reset) */
  lookForward: boolean;
}

/** Smoothed control inputs (0..1) for physics layer */
export interface ControlInputs {
  steerLeft: number;
  steerRight: number;
  brake: number;
  acceleratedFlight: number;
}

/** Camera look inputs - raw, used for head look */
export interface LookInputs {
  lookLeft: boolean;
  lookRight: boolean;
  lookUp: boolean;
  lookDown: boolean;
  lookForward: boolean;
}
