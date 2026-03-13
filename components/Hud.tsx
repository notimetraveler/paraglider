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
 * Compact flight device — bottom-left only, instrument-style panel.
 * Keeps FPV clear; heading, wind and main instruments in one small unit.
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
  const inFlareZone =
    data.inFlareZone ??
    (data.altitude <= 4 && data.altitude > 0 && data.state === "airborne");

  const windSpeed = Math.hypot(data.windX, data.windZ);
  const hasWind = windSpeed >= 0.1;
  const windFromRad = Math.atan2(-data.windX, -data.windZ);
  const windFromDeg = (windFromRad * (180 / Math.PI) + 360) % 360;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-between"
      data-testid="hud"
    >
      {/* Full-screen thermiek gloed */}
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

      {/* Pause — top center, small */}
      {isPaused && (
        <div className="flex justify-center pt-5">
          <div className="rounded bg-amber-500/90 px-4 py-1.5 font-mono text-base font-semibold text-black">
            PAUZE
          </div>
        </div>
      )}

      {/* Thermiek / flare badges — top center, only when active */}
      {(inThermal || inFlareZone) && (
        <div className="flex justify-center gap-2.5 pt-2.5">
          {inThermal && (
            <span
              className="rounded bg-amber-500/80 px-2.5 py-1 font-mono text-sm text-black"
              data-testid="thermal-badge"
            >
              THERMIEK +{data.thermalLift.toFixed(1)}
            </span>
          )}
          {inFlareZone && (
            <span
              className="rounded bg-sky-500/80 px-2.5 py-1 font-mono text-sm text-white"
              data-testid="flare-hint"
            >
              ↓ FLARE
            </span>
          )}
        </div>
      )}

      {/* Flight device — bottom-left only: compact instrument panel (~25% larger) */}
      <div className="absolute left-5 bottom-5">
        <div
          className="rounded-xl border-2 border-slate-600/90 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* Top row: compass + wind in one line */}
          <div className="mb-2.5 flex items-center justify-between gap-4 border-b border-slate-600/80 pb-2 font-mono text-[14px]">
            <span className="tabular-nums text-white">
              {formatHeadingCompass(data.heading)}{" "}
              <span className="text-slate-400">
                {((data.heading * (180 / Math.PI) + 360) % 360).toFixed(0)}°
              </span>
            </span>
            <span className="flex items-center gap-2 text-amber-200/90">
              {hasWind && (
                <span
                  className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-amber-400/80 bg-slate-800"
                  aria-hidden
                >
                  <span
                    className="inline-block h-2 w-px bg-amber-300"
                    style={{
                      transformOrigin: "50% 100%",
                      transform: `rotate(${windFromRad}rad)`,
                    }}
                  />
                </span>
              )}
              <span>{formatWind(data.windX, data.windZ)}</span>
              {hasWind && (
                <span className="text-slate-400">
                  {windFromDeg.toFixed(0)}°
                </span>
              )}
            </span>
          </div>
          {/* Instruments */}
          <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 gap-y-1 font-mono text-[15px]">
            <span className="text-slate-500">AIR</span>
            <span className="tabular-nums font-semibold text-white">
              {formatSpeed(data.airspeed)}
            </span>
            <span className="text-slate-500">m/s</span>
            <span className="text-slate-500">GS</span>
            <span className="tabular-nums font-semibold text-sky-300">
              {formatSpeed(data.groundSpeed)}
            </span>
            <span className="text-slate-500">m/s</span>
            <span className="text-slate-500">ALT</span>
            <span className="tabular-nums font-semibold text-white">
              {formatAltitude(data.altitude)}
            </span>
            <span className="text-slate-500">m</span>
            {data.gateProgress && data.gateProgress.total > 0 && (
              <>
                <span className="text-slate-500">GATE</span>
                <span className="tabular-nums font-semibold text-cyan-300">
                  {data.gateProgress.passed}/{data.gateProgress.total}
                </span>
                <span />
              </>
            )}
            {data.distanceToLz !== undefined && (
              <>
                <span className="text-slate-500">LZ</span>
                <span className="tabular-nums font-semibold text-sky-300">
                  {Math.round(data.distanceToLz)} m
                </span>
                <span />
              </>
            )}
            <span className="text-slate-500">VSI</span>
            <span
              className={`tabular-nums font-semibold ${
                data.verticalSpeed > 0 ? "text-emerald-400" : "text-white"
              }`}
            >
              {formatVerticalSpeed(data.verticalSpeed)}
            </span>
            <span className="text-slate-500">m/s</span>
            {data.thermalLift > 0.1 && (
              <>
                <span className="text-slate-500">LFT</span>
                <span className="tabular-nums font-semibold text-amber-400">
                  +{data.thermalLift.toFixed(1)}
                </span>
                <span className="text-slate-500">m/s</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Debug — bottom-right */}
      {(showInputDebug || showEnvDebug || showTuningDebug) && (
        <div
          className="absolute bottom-5 right-5 flex flex-col gap-1.5 rounded-lg border border-slate-600/80 bg-slate-900/90 px-3 py-2 font-mono text-xs text-slate-400"
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
                  <> | P {tuningDebug.worldX.toFixed(0)} {tuningDebug.worldY.toFixed(0)} {tuningDebug.worldZ.toFixed(0)}</>
                )}
              {tuningDebug.groundAt !== undefined && (
                <> | G {tuningDebug.groundAt.toFixed(0)} ALT {tuningDebug.heightAboveGround?.toFixed(0)}</>
              )}
              {tuningDebug.collisionState && <> | {tuningDebug.collisionState}</>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
