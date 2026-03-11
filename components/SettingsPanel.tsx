"use client";

import type { SimulatorSettings } from "@/modules/settings";

interface SettingsPanelProps {
  settings: SimulatorSettings;
  onSettingsChange: (update: Partial<SimulatorSettings>) => void;
  onClose?: () => void;
  compact?: boolean;
}

/**
 * Compact settings panel - audio toggles, debug.
 * Used in pause overlay or as standalone.
 */
export function SettingsPanel({
  settings,
  onSettingsChange,
  onClose,
  compact = true,
}: SettingsPanelProps) {
  const toggle = (key: keyof SimulatorSettings, value: boolean) => {
    onSettingsChange({ [key]: value });
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-lg bg-black/50 px-4 py-3 font-mono text-sm text-white/95 backdrop-blur-sm"
      data-testid="settings-panel"
    >
      <div className="flex items-center justify-between border-b border-white/20 pb-2">
        <span className="font-semibold">Instellingen</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-0.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Sluiten
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>Variometer</span>
          <input
            type="checkbox"
            checked={settings.varioEnabled}
            onChange={(e) => toggle("varioEnabled", e.target.checked)}
            className="h-4 w-4 rounded"
            data-testid="setting-vario"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>Wind</span>
          <input
            type="checkbox"
            checked={settings.windEnabled}
            onChange={(e) => toggle("windEnabled", e.target.checked)}
            className="h-4 w-4 rounded"
            data-testid="setting-wind"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>Landing</span>
          <input
            type="checkbox"
            checked={settings.landingEnabled}
            onChange={(e) => toggle("landingEnabled", e.target.checked)}
            className="h-4 w-4 rounded"
            data-testid="setting-landing"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>Debug HUD</span>
          <input
            type="checkbox"
            checked={settings.debugMode}
            onChange={(e) => toggle("debugMode", e.target.checked)}
            className="h-4 w-4 rounded"
            data-testid="setting-debug"
          />
        </label>
      </div>
      {!compact && (
        <p className="mt-1 text-[10px] text-white/50">
          P = pauze · C = camera · ←→ sturen · ↑↓ rem/snel
        </p>
      )}
    </div>
  );
}
