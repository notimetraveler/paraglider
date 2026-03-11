import type { RawInputState, ControlInputs } from "./types";

const FLIGHT_KEY_MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "brake",
  ArrowUp: "acceleratedFlight",
} as const;

const LOOK_KEY_MAP = {
  KeyA: "lookLeft",
  KeyD: "lookRight",
  KeyW: "lookUp",
  KeyX: "lookDown",
  KeyS: "lookForward",
} as const;

const KEY_MAP = { ...FLIGHT_KEY_MAP, ...LOOK_KEY_MAP } as const;

export type KeyCode = keyof typeof KEY_MAP;

/** Create empty raw input state */
export function createEmptyInputState(): RawInputState {
  return {
    left: false,
    right: false,
    brake: false,
    acceleratedFlight: false,
    lookLeft: false,
    lookRight: false,
    lookUp: false,
    lookDown: false,
    lookForward: false,
  };
}

/** Map raw keyboard state to control inputs (0..1). No smoothing yet. */
export function rawToControlInputs(raw: RawInputState): ControlInputs {
  return {
    steerLeft: raw.left ? 1 : 0,
    steerRight: raw.right ? 1 : 0,
    brake: raw.brake ? 1 : 0,
    acceleratedFlight: raw.acceleratedFlight ? 1 : 0,
  };
}

/** Check if a key code is a known control */
export function isControlKey(code: string): code is KeyCode {
  return code in KEY_MAP;
}

/** Get the control name for a key */
export function getControlForKey(code: KeyCode): keyof RawInputState {
  return KEY_MAP[code] as keyof RawInputState;
}
