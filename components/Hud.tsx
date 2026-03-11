"use client";

import {
  formatSpeed,
  formatAltitude,
  formatVerticalSpeed,
  formatHeadingCompass,
  formatWind,
  type HudData,
  type HudInputDebug,
  type HudEnvDebug,
} from "@/modules/hud";

interface HudProps {
  data: HudData;
  inputDebug?: HudInputDebug | null;
  envDebug?: HudEnvDebug | null;
  debugMode?: boolean;
  isPaused?: boolean;
}

/**
 * Minimal professional HUD - first-person flight instruments.
 * Keeps FPV unobstructed; clear visual hierarchy.
 * Debug input state and env only when debugMode is true.
 */
export function Hud({
  data,
  inputDebug,
  envDebug,
  debugMode,
  isPaused = false,
}: HudProps) {
  const showInputDebug = debugMode && inputDebug;
  const showEnvDebug = debugMode && envDebug;

  const inThermal = data.thermalLift > 0.1;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-between"
      data-testid="hud"
    >
      {/* Top: heading / compass + wind + pause indicator */}
      <div className="flex flex-col items-center gap-2 pt-6">
        {isPaused && (
          <div className="rounded bg-amber-500/80 px-3 py-1 font-mono text-sm font-semibold text-black">
            PAUZE
          </div>
        )}
        {inThermal && (
          <div
            className="rounded bg-amber-500/40 px-2 py-0.5 font-mono text-xs font-medium text-amber-100"
            data-testid="thermal-badge"
          >
            THERMIEK +{data.thermalLift.toFixed(1)} m/s
          </div>
        )}
        <div className="rounded bg-black/40 px-3 py-1 font-mono text-sm font-medium text-white/95 backdrop-blur-sm">
          <span className="tabular-nums">{formatHeadingCompass(data.heading)}</span>
          <span className="ml-1.5 text-white/70">
            {((data.heading * (180 / Math.PI) + 360) % 360).toFixed(0)}°
          </span>
        </div>
        <div className="rounded bg-black/50 px-2 py-0.5 font-mono text-xs text-amber-200/95">
          WIND {formatWind(data.windX, data.windZ)}
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
          {data.thermalLift > 0.1 && (
            <div className="flex items-baseline gap-3">
              <span className="text-white/60">LFT</span>
              <span className="tabular-nums font-semibold text-amber-400">
                +{data.thermalLift.toFixed(1)}
              </span>
              <span className="text-white/50">m/s</span>
            </div>
          )}
        </div>
      </div>

      {/* Debug: input + env - small, subtle, bottom-right */}
      {(showInputDebug || showEnvDebug) && (
        <div
          className="absolute bottom-8 right-6 flex flex-col gap-1 rounded bg-black/30 px-2 py-1 font-mono text-[10px] text-white/60"
          data-testid="hud-debug"
        >
          {showInputDebug && (
            <span data-testid="hud-input-debug">
              L{Math.round(inputDebug.steerLeft * 100)} R
              {Math.round(inputDebug.steerRight * 100)} B
              {Math.round(inputDebug.brake * 100)} A
              {Math.round(inputDebug.acceleratedFlight * 100)}
            </span>
          )}
          {showEnvDebug && (
            <span data-testid="hud-env-debug">
              W {envDebug.windX.toFixed(1)} {envDebug.windZ.toFixed(1)} | L
              {envDebug.thermalLift.toFixed(1)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
