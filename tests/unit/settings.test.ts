import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS, type SimulatorSettings } from "@/modules/settings";

describe("settings", () => {
  it("DEFAULT_SETTINGS has all required keys", () => {
    expect(DEFAULT_SETTINGS.varioEnabled).toBeDefined();
    expect(DEFAULT_SETTINGS.windEnabled).toBeDefined();
    expect(DEFAULT_SETTINGS.landingEnabled).toBeDefined();
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

  it("settings can be merged with partial update", () => {
    const update: Partial<SimulatorSettings> = { varioEnabled: false };
    const result = { ...DEFAULT_SETTINGS, ...update };
    expect(result.varioEnabled).toBe(false);
    expect(result.windEnabled).toBe(true);
  });
});
