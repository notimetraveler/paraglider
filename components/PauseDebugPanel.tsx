"use client";

export interface PauseDebugSnapshot {
  worldX: number;
  worldY: number;
  worldZ: number;
  terrainHeight: number;
  altitudeAboveGround: number;
  collisionState: "airborne" | "contact";
  airspeed: number;
  verticalSpeed: number;
  flightState: string;
  cameraMode: "fpv" | "tpv" | "top";
}

interface PauseDebugPanelProps {
  snapshot: PauseDebugSnapshot;
}

function formatVec(value: number): string {
  return value.toFixed(1);
}

export function PauseDebugPanel({ snapshot }: PauseDebugPanelProps) {
  return (
    <div
      className="w-full max-w-2xl rounded-xl border border-amber-300/35 bg-black/75 px-5 py-4 font-mono text-sm text-white shadow-2xl backdrop-blur-sm"
      data-testid="pause-debug-panel"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-amber-200/80">
            Debug Snapshot
          </div>
          <div className="text-base font-semibold text-white">
            ALT = worldY - terrainHeight
          </div>
        </div>
        <div
          className={`rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
            snapshot.collisionState === "contact"
              ? "bg-red-500/25 text-red-200"
              : "bg-emerald-500/20 text-emerald-200"
          }`}
        >
          {snapshot.collisionState}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <span className="text-white/60">Wereldpositie</span>
          <span className="tabular-nums text-white">
            {formatVec(snapshot.worldX)} / {formatVec(snapshot.worldY)} /{" "}
            {formatVec(snapshot.worldZ)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/60">Terreinhoogte</span>
          <span className="tabular-nums text-white">
            {formatVec(snapshot.terrainHeight)} m
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/60">ALT boven grond</span>
          <span className="tabular-nums text-amber-300">
            {formatVec(snapshot.altitudeAboveGround)} m
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/60">Collision</span>
          <span className="tabular-nums text-white">
            {snapshot.collisionState}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/60">Vluchtstatus</span>
          <span className="tabular-nums text-white">{snapshot.flightState}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/60">Camera</span>
          <span className="tabular-nums text-white">{snapshot.cameraMode}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/60">Airspeed</span>
          <span className="tabular-nums text-white">
            {formatVec(snapshot.airspeed)} m/s
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/60">Verticale snelheid</span>
          <span className="tabular-nums text-white">
            {formatVec(snapshot.verticalSpeed)} m/s
          </span>
        </div>
      </div>
    </div>
  );
}
