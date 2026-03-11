/** Simulator settings - audio, debug. Session-stable. */
export interface SimulatorSettings {
  varioEnabled: boolean;
  windEnabled: boolean;
  landingEnabled: boolean;
  debugMode: boolean;
}

export const DEFAULT_SETTINGS: SimulatorSettings = {
  varioEnabled: true,
  windEnabled: true,
  landingEnabled: true,
  debugMode: false,
};
