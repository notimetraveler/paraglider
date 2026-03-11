import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  mergeWithDefaults,
  STORAGE_KEY,
  type SimulatorSettings,
} from "@/modules/settings";

function createFakeStorage(): { storage: Record<string, string>; fake: Storage } {
  const storage: Record<string, string> = {};
  const fake: Storage = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => {
      storage[key] = value;
    },
    removeItem: () => {},
    clear: () => {},
    get length() {
      return Object.keys(storage).length;
    },
    key: () => null,
  };
  return { storage, fake };
}

describe("settings", () => {
  it("DEFAULT_SETTINGS has all required keys", () => {
    expect(DEFAULT_SETTINGS.varioEnabled).toBeDefined();
    expect(DEFAULT_SETTINGS.windEnabled).toBeDefined();
    expect(DEFAULT_SETTINGS.landingEnabled).toBeDefined();
    expect(DEFAULT_SETTINGS.varioVolume).toBeDefined();
    expect(DEFAULT_SETTINGS.windVolume).toBeDefined();
    expect(DEFAULT_SETTINGS.landingVolume).toBeDefined();
    expect(DEFAULT_SETTINGS.debugMode).toBeDefined();
  });

  it("DEFAULT_SETTINGS has audio enabled", () => {
    expect(DEFAULT_SETTINGS.varioEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.windEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.landingEnabled).toBe(true);
  });

  it("DEFAULT_SETTINGS has debug off", () => {
    expect(DEFAULT_SETTINGS.debugMode).toBe(false);
  });

  it("DEFAULT_SETTINGS has volume in valid range", () => {
    expect(DEFAULT_SETTINGS.varioVolume).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.varioVolume).toBeLessThanOrEqual(1);
    expect(DEFAULT_SETTINGS.windVolume).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.windVolume).toBeLessThanOrEqual(1);
    expect(DEFAULT_SETTINGS.landingVolume).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.landingVolume).toBeLessThanOrEqual(1);
  });

  it("settings can be merged with partial update", () => {
    const update: Partial<SimulatorSettings> = { varioEnabled: false };
    const result = { ...DEFAULT_SETTINGS, ...update };
    expect(result.varioEnabled).toBe(false);
    expect(result.windEnabled).toBe(true);
  });
});

describe("settings persistence", () => {
  let storage: Record<string, string>;
  let fake: Storage;

  beforeEach(() => {
    const created = createFakeStorage();
    storage = created.storage;
    fake = created.fake;
  });

  it("loadSettings returns defaults when storage is null", () => {
    const result = loadSettings(null);
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("loadSettings returns defaults when key is missing", () => {
    const result = loadSettings(fake);
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("saveSettings and loadSettings round-trip", () => {
    const custom: SimulatorSettings = {
      ...DEFAULT_SETTINGS,
      varioEnabled: false,
      varioVolume: 0.5,
    };
    saveSettings(fake, custom);
    const loaded = loadSettings(fake);
    expect(loaded.varioEnabled).toBe(false);
    expect(loaded.varioVolume).toBe(0.5);
  });

  it("loadSettings returns defaults on corrupt JSON", () => {
    storage[STORAGE_KEY] = "not valid json {{{";
    const result = loadSettings(fake);
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("mergeWithDefaults clamps invalid volume to range", () => {
    const parsed = { varioVolume: 2, windVolume: -1 };
    const result = mergeWithDefaults(parsed);
    expect(result.varioVolume).toBe(1);
    expect(result.windVolume).toBe(0);
  });

  it("mergeWithDefaults uses default for NaN volume", () => {
    const parsed = { landingVolume: NaN };
    const result = mergeWithDefaults(parsed);
    expect(result.landingVolume).toBe(DEFAULT_SETTINGS.landingVolume);
  });

  it("mergeWithDefaults uses defaults for missing fields", () => {
    const result = mergeWithDefaults({});
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("mergeWithDefaults handles non-object", () => {
    expect(mergeWithDefaults(null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeWithDefaults("string")).toEqual(DEFAULT_SETTINGS);
  });
});
