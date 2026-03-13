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
  type HudTuningDebug,
} from "@/modules/hud";

interface HudProps {
  data: HudData;
  inputDebug?: HudInputDebug | null;
  envDebug?: HudEnvDebug | null;
  tuningDebug?: HudTuningDebug | null;
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
  tuningDebug,
  debugMode,
  isPaused = false,
}: HudProps) {
  const showInputDebug = debugMode && inputDebug;
  const showEnvDebug = debugMode && envDebug;
  const showTuningDebug = debugMode && tuningDebug;

  const inThermal = data.thermalLift > 0.05;
  const thermalStrength = Math.min(1, data.thermalLift / 2);
  const inFlareZone = data.inFlareZone ?? (data.altitude <= 4 && data.altitude > 0 && data.state === "airborne");

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-between"
      data-testid="hud"
    >
      {/* Duidelijke oranje gloed: onmiskenbaar wanneer je in thermiek zit */}
      {inThermal && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, rgba(251, 146, 60, ${0.2 + thermalStrength * 0.25}) 0%, rgba(234, 88, 12, ${0.1 + thermalStrength * 0.15}) 60%, transparent 100%)`,
            boxShadow: "inset 0 0 150px rgba(251, 146, 60, 0.25)",
            border: "5px solid rgba(251, 146, 60, 0.5)",
          }}
          data-testid="thermal-indicator"
          aria-hidden
        />
      )}
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
        {inFlareZone && (
          <div
            className="rounded bg-sky-600/50 px-2 py-0.5 font-mono text-xs font-medium text-sky-100"
            data-testid="flare-hint"
          >
            ↓ FLARE
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
          {data.gateProgress && data.gateProgress.total > 0 && (
            <div className="flex items-baseline gap-3">
              <span className="text-white/60">GATE</span>
              <span className="tabular-nums font-semibold text-cyan-300">
                {data.gateProgress.passed}/{data.gateProgress.total}
              </span>
            </div>
          )}
          {data.distanceToLz !== undefined && (
            <div className="flex items-baseline gap-3">
              <span className="text-white/60">LZ</span>
              <span className="tabular-nums font-semibold text-sky-300">
                {Math.round(data.distanceToLz)} m
              </span>
            </div>
          )}
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

      {/* Debug: input + env + tuning - ?debug=1 */}
      {(showInputDebug || showEnvDebug || showTuningDebug) && (
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
          {showTuningDebug && (
            <span data-testid="hud-tuning-debug">
              Sink {tuningDebug.sinkTrim.toFixed(1)} | Bank{" "}
              {tuningDebug.bankDeg.toFixed(0)}° |{" "}
              {tuningDebug.inFlareZone ? "FLARE" : "—"}
              {tuningDebug.worldX !== undefined &&
                tuningDebug.worldY !== undefined &&
                tuningDebug.worldZ !== undefined && (
                  <>
                    {" "}
                    | P {tuningDebug.worldX.toFixed(0)} {tuningDebug.worldY.toFixed(0)}{" "}
                    {tuningDebug.worldZ.toFixed(0)}
                  </>
                )}
              {tuningDebug.groundAt !== undefined && (
                <>
                  {" "}
                  | G {tuningDebug.groundAt.toFixed(0)} ALT{" "}
                  {tuningDebug.heightAboveGround?.toFixed(0)}
                </>
              )}
              {tuningDebug.collisionState && <> | {tuningDebug.collisionState}</>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
