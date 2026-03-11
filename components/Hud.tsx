"use client";

import {
  formatSpeed,
  formatAltitude,
  formatVerticalSpeed,
  formatHeadingCompass,
  type HudData,
  type HudInputDebug,
} from "@/modules/hud";

interface HudProps {
  data: HudData;
  inputDebug?: HudInputDebug | null;
  debugMode?: boolean;
}

/**
 * Minimal professional HUD - first-person flight instruments.
 * Keeps FPV unobstructed; clear visual hierarchy.
 * Debug input state only when debugMode is true.
 */
export function Hud({ data, inputDebug, debugMode }: HudProps) {
  const showInputDebug = debugMode && inputDebug;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-between"
      data-testid="hud"
    >
      {/* Top: heading / compass - minimal */}
      <div className="flex justify-center pt-6">
        <div className="rounded bg-black/40 px-3 py-1 font-mono text-sm font-medium text-white/95 backdrop-blur-sm">
          <span className="tabular-nums">{formatHeadingCompass(data.heading)}</span>
          <span className="ml-1.5 text-white/70">
            {((data.heading * (180 / Math.PI) + 360) % 360).toFixed(0)}°
          </span>
        </div>
      </div>

      {/* Center: main instruments - bottom-left, compact */}
      <div className="pb-8 pl-6">
        <div className="flex flex-col gap-0.5 font-mono text-sm">
          <div className="flex items-baseline gap-3">
            <span className="text-white/60">SPD</span>
            <span className="tabular-nums font-semibold text-white">
              {formatSpeed(data.airspeed)}
            </span>
            <span className="text-white/50">m/s</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-white/60">ALT</span>
            <span className="tabular-nums font-semibold text-white">
              {formatAltitude(data.altitude)}
            </span>
            <span className="text-white/50">m</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-white/60">VSI</span>
            <span
              className={`tabular-nums font-semibold ${
                data.verticalSpeed > 0 ? "text-emerald-400" : "text-white"
              }`}
            >
              {formatVerticalSpeed(data.verticalSpeed)}
            </span>
            <span className="text-white/50">m/s</span>
          </div>
        </div>
      </div>

      {/* Debug: input state - small, subtle, bottom-right */}
      {showInputDebug && (
        <div
          className="absolute bottom-8 right-6 rounded bg-black/30 px-2 py-1 font-mono text-[10px] text-white/60"
          data-testid="hud-input-debug"
        >
          L{Math.round(inputDebug.steerLeft * 100)} R
          {Math.round(inputDebug.steerRight * 100)} B
          {Math.round(inputDebug.brake * 100)} A
          {Math.round(inputDebug.acceleratedFlight * 100)}
        </div>
      )}
    </div>
  );
}
