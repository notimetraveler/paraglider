"use client";

import type { SimulatorSettings } from "@/modules/settings";
import { VOLUME_MAX } from "@/modules/settings";

function AudioRow({
  label,
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  toggleTestId,
  volumeTestId,
}: {
  label: string;
  enabled: boolean;
  volume: number;
  onToggle: (v: boolean) => void;
  onVolumeChange: (v: number) => void;
  toggleTestId: string;
  volumeTestId: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span>{label}</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded"
          data-testid={toggleTestId}
        />
      </label>
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 text-[10px] text-white/50">Vol</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          className="h-1 w-16 shrink-0 accent-white/70"
          data-testid={volumeTestId}
        />
      </div>
    </div>
  );
}

interface SettingsPanelProps {
  settings: SimulatorSettings;
  onSettingsChange: (update: Partial<SimulatorSettings>) => void;
  onClose?: () => void;
  compact?: boolean;
}

/**
 * Compact settings panel - audio toggles, volume sliders, debug.
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

  const setVolume = (key: "varioVolume" | "windVolume" | "landingVolume", value: number) => {
    onSettingsChange({ [key]: Math.max(0, Math.min(VOLUME_MAX, value)) });
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
            data-testid="settings-close"
          >
            Sluiten
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <AudioRow
          label="Variometer"
          enabled={settings.varioEnabled}
          volume={settings.varioVolume}
          onToggle={(v) => toggle("varioEnabled", v)}
          onVolumeChange={(v) => setVolume("varioVolume", v)}
          toggleTestId="setting-vario"
          volumeTestId="setting-vario-volume"
        />
        <AudioRow
          label="Wind"
          enabled={settings.windEnabled}
          volume={settings.windVolume}
          onToggle={(v) => toggle("windEnabled", v)}
          onVolumeChange={(v) => setVolume("windVolume", v)}
          toggleTestId="setting-wind"
          volumeTestId="setting-wind-volume"
        />
        <AudioRow
          label="Landing"
          enabled={settings.landingEnabled}
          volume={settings.landingVolume}
          onToggle={(v) => toggle("landingEnabled", v)}
          onVolumeChange={(v) => setVolume("landingVolume", v)}
          toggleTestId="setting-landing"
          volumeTestId="setting-landing-volume"
        />
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
