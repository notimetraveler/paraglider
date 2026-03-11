/**
 * Settings persistence - localStorage with safe load/save and fallbacks.
 * Pure logic for testability; no React or DOM coupling.
 */

import {
  DEFAULT_SETTINGS,
  VOLUME_MIN,
  VOLUME_MAX,
  type SimulatorSettings,
} from "./types";

export const STORAGE_KEY = "paraglider-settings";

/** Clamp volume to valid range; returns default if missing/invalid */
function parseVolume(v: unknown, fallback: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, v));
}

/** Validate and merge parsed data with defaults */
export function mergeWithDefaults(parsed: unknown): SimulatorSettings {
  if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SETTINGS };

  const obj = parsed as Record<string, unknown>;
  return {
    varioEnabled: typeof obj.varioEnabled === "boolean" ? obj.varioEnabled : DEFAULT_SETTINGS.varioEnabled,
    windEnabled: typeof obj.windEnabled === "boolean" ? obj.windEnabled : DEFAULT_SETTINGS.windEnabled,
    landingEnabled: typeof obj.landingEnabled === "boolean" ? obj.landingEnabled : DEFAULT_SETTINGS.landingEnabled,
    varioVolume: parseVolume(obj.varioVolume, DEFAULT_SETTINGS.varioVolume),
    windVolume: parseVolume(obj.windVolume, DEFAULT_SETTINGS.windVolume),
    landingVolume: parseVolume(obj.landingVolume, DEFAULT_SETTINGS.landingVolume),
    debugMode: typeof obj.debugMode === "boolean" ? obj.debugMode : DEFAULT_SETTINGS.debugMode,
  };
}

/** Load settings from storage. Returns defaults on missing/corrupt data. */
export function loadSettings(storage: Storage | null): SimulatorSettings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as unknown;
    return mergeWithDefaults(parsed);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Save settings to storage. No-op if storage unavailable. */
export function saveSettings(storage: Storage | null, settings: SimulatorSettings): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Quota exceeded or disabled - fail silently
  }
}
