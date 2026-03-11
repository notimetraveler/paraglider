/** Simulator settings - audio, debug. Session-stable. */
export interface SimulatorSettings {
  varioEnabled: boolean;
  windEnabled: boolean;
  landingEnabled: boolean;
  varioVolume: number;
  windVolume: number;
  landingVolume: number;
  debugMode: boolean;
}

/** Volume range 0..1 */
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;

export const DEFAULT_SETTINGS: SimulatorSettings = {
  varioEnabled: true,
  windEnabled: true,
  landingEnabled: true,
  varioVolume: 0.25,
  windVolume: 0.18,
  landingVolume: 0.4,
  debugMode: false,
};
