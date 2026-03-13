"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createFpvScene,
  resizeFpvScene,
  syncCameraFromAircraft,
  type FpvScene,
  type HeadLook,
} from "@/modules/rendering/fpv-scene";
import {
  createLaunchState,
  simulateStep,
  type AircraftState,
} from "@/modules/flight-model";
import {
  deriveFlightState,
  didJustLand,
  classifyLandingQuality,
} from "@/modules/game-session";
import type { FlightState } from "@/modules/flight-model/types";
import type { ControlInputs } from "@/modules/input";
import { mapAircraftToHudData, mapInputsToDebug } from "@/modules/hud";
import type {
  HudData,
  HudInputDebug,
  HudEnvDebug,
  HudTuningDebug,
} from "@/modules/hud";
import {
  getDefaultLevel,
  environmentFromLevel,
} from "@/modules/world/level-loader";
import { sampleTerrainState, terrainHeightAt } from "@/modules/world/terrain";
import { checkGateProgress } from "@/modules/world/gates";
import {
  formatAirtime,
  formatDistance,
  type SessionStats,
} from "@/modules/scoring";
import { getThermalLift, getRidgeLift } from "@/modules/world/lift";
import {
  SINK_AT_TRIM,
  FLARE_ALTITUDE,
  BRAKE_ACCEL_RAMP_RATE,
  STEER_RAMP_UP,
  STEER_RAMP_DOWN,
} from "@/modules/flight-model/tuning";
import {
  createVariometer,
  createWindAudio,
  playLandingSound,
} from "@/modules/audio";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type SimulatorSettings,
} from "@/modules/settings";
import { useInput } from "./InputManager";
import { Hud } from "./Hud";
import {
  PauseDebugPanel,
  type PauseDebugSnapshot,
} from "./PauseDebugPanel";
import { SettingsPanel } from "./SettingsPanel";

const SIM_DT = 1 / 60;
const MAX_HEAD_YAW = Math.PI / 2;
const MAX_HEAD_PITCH = (60 * Math.PI) / 180;
/** Look ramp: smooth like steer keys */
const LOOK_RAMP_UP = 0.45;
const LOOK_RAMP_DOWN = 0.35;
/** HUD update rate - snelle thermiek-indicator respons */
const HUD_UPDATE_INTERVAL_MS = 50;

/**
 * Simulator shell - FPV-first 3D render container.
 * Simulation loop updates aircraft state per frame; camera follows aircraft.
 */
function useInitialDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function useThermalsDisabled(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("thermals") === "0";
}

function buildPauseDebugSnapshot(
  state: AircraftState,
  getHeight: (x: number, z: number) => number,
  flightState: FlightState,
  cameraMode: "fpv" | "tpv" | "top"
): PauseDebugSnapshot {
  const terrainSample = sampleTerrainState({
    x: state.position.x,
    z: state.position.z,
    worldY: state.position.y,
    getHeight,
  });

  return {
    worldX: state.position.x,
    worldY: state.position.y,
    worldZ: state.position.z,
    terrainHeight: terrainSample.terrainHeight,
    altitudeAboveGround: Math.max(0, terrainSample.altitudeAboveGround),
    collisionState: terrainSample.altitudeAboveGround <= 0 ? "contact" : "airborne",
    airspeed: state.airspeed,
    verticalSpeed: state.verticalSpeed,
    flightState,
    cameraMode,
  };
}

export function SimulatorShell() {
  const level = useMemo(() => getDefaultLevel(), []);
  const thermalsDisabled = useThermalsDisabled();
  const env = useMemo(() => {
    const base = environmentFromLevel(level);
    if (thermalsDisabled) {
      return { ...base, thermals: [] };
    }
    return base;
  }, [level, thermalsDisabled]);
  const groundHeightAt = env.getGroundHeight ?? terrainHeightAt;

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FpvScene | null>(null);
  const stateRef = useRef<AircraftState>(
    createLaunchState(level.launch)
  );
  const brakeLevelRef = useRef(0);
  const accelLevelRef = useRef(0);
  const steerLeftLevelRef = useRef(0);
  const steerRightLevelRef = useRef(0);
  const gatePassedRef = useRef(0);
  const { raw, controls } = useInput();
  const controlsRef = useRef<ControlInputs>(controls);
  const rawRef = useRef(raw);
  const urlDebug = useInitialDebugMode();
  const [settings, setSettings] = useState<SimulatorSettings>(() => ({
    ...DEFAULT_SETTINGS,
    debugMode: urlDebug,
  }));
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      try {
        const loaded = loadSettings(window.localStorage);
        setSettings({ ...loaded, debugMode: loaded.debugMode || urlDebug });
      } catch {
        setSettings({ ...DEFAULT_SETTINGS, debugMode: urlDebug });
      }
    });
  }, [urlDebug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      saveSettings(window.localStorage, settings);
    } catch {
      // localStorage disabled, quota exceeded, or private browsing
    }
  }, [settings]);

  const [hudData, setHudData] = useState<HudData>(() =>
    mapAircraftToHudData(createLaunchState(level.launch), env, {
      getGroundHeight: groundHeightAt,
      landingZone: level.landingZone,
      gateProgress: { passed: 0, total: level.gates.length },
    })
  );
  const [hudInputDebug, setHudInputDebug] = useState<HudInputDebug | null>(null);
  const [hudEnvDebug, setHudEnvDebug] = useState<HudEnvDebug | null>(null);
  const [hudTuningDebug, setHudTuningDebug] = useState<HudTuningDebug | null>(null);
  const [flightState, setFlightState] = useState<FlightState>("airborne");
  const [isPaused, setIsPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState<"fpv" | "tpv" | "top">("fpv");
  const [pauseDebugSnapshot, setPauseDebugSnapshot] = useState<PauseDebugSnapshot>(
    () =>
      buildPauseDebugSnapshot(
        createLaunchState(level.launch),
        groundHeightAt,
        "airborne",
        "fpv"
      )
  );
  const isPausedRef = useRef(false);
  const cameraModeRef = useRef<"fpv" | "tpv" | "top">("fpv");
  useEffect(() => {
    isPausedRef.current = isPaused;
    cameraModeRef.current = cameraMode;
  }, [isPaused, cameraMode]);
    const lastHudUpdateRef = useRef(0);
  const varioResumedRef = useRef(false);
  const lastVarioConfigRef = useRef({ enabled: true, volume: 0.25 });
  const lastWindConfigRef = useRef({ enabled: true, volume: 0.18 });
  const launchTimeRef = useRef(0);
  const maxAltitudeRef = useRef(0);
  const maxDistanceRef = useRef(0);
  const [scoreSummary, setScoreSummary] = useState<SessionStats | null>(null);

  const resetSimulationState = useMemo(
    () => () => {
      const initialState = createLaunchState(level.launch);
      stateRef.current = initialState;
      brakeLevelRef.current = 0;
      accelLevelRef.current = 0;
      steerLeftLevelRef.current = 0;
      steerRightLevelRef.current = 0;
      gatePassedRef.current = 0;
      headLookRef.current = { yaw: 0, pitch: 0 };
      launchTimeRef.current = performance.now();
      maxAltitudeRef.current = 0;
      maxDistanceRef.current = 0;
      setIsPaused(false);
      setFlightState("airborne");
      setScoreSummary(null);
      setHudData(
        mapAircraftToHudData(initialState, env, {
          getGroundHeight: groundHeightAt,
          landingZone: level.landingZone,
          gateProgress: { passed: 0, total: level.gates.length },
        })
      );
      setPauseDebugSnapshot(
        buildPauseDebugSnapshot(initialState, groundHeightAt, "airborne", cameraModeRef.current)
      );
    },
    [env, groundHeightAt, level]
  );

  const handleRestart = () => {
    resetSimulationState();
  };

  useEffect(() => {
    controlsRef.current = controls;
    rawRef.current = raw;
  }, [raw, controls]);

  const headLookRef = useRef<HeadLook>({ yaw: 0, pitch: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyP" && !e.repeat) {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
      if (e.code === "KeyC" && !e.repeat) {
        e.preventDefault();
        setCameraMode((m) =>
          m === "fpv" ? "tpv" : m === "tpv" ? "top" : "fpv"
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const vario = createVariometer({
      volume: settingsRef.current.varioVolume,
      enabled: settingsRef.current.varioEnabled,
    });
    const wind = createWindAudio({
      volume: settingsRef.current.windVolume,
      enabled: settingsRef.current.windEnabled,
    });

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    container.prepend(canvas);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = createFpvScene(canvas, level);
    resizeFpvScene(scene, width, height);
    sceneRef.current = scene;
    launchTimeRef.current = performance.now();
    maxAltitudeRef.current = 0;
    maxDistanceRef.current = 0;

    const inputsCache = {
      steerLeft: 0,
      steerRight: 0,
      brake: 0,
      acceleratedFlight: 0,
    };
    let frameId: number;
    function animate() {
      frameId = requestAnimationFrame(animate);

      const raw = controlsRef.current;
      const rawInput = rawRef.current;
      let brakeLevel = brakeLevelRef.current;
      let accelLevel = accelLevelRef.current;

      // Smooth head look (a,d,w,x,s) - same ramp style as steer keys. a=left, d=right.
      let { yaw: headYaw, pitch: headPitch } = headLookRef.current;
      const targetYaw = rawInput.lookForward
        ? 0
        : rawInput.lookLeft
          ? MAX_HEAD_YAW
          : rawInput.lookRight
            ? -MAX_HEAD_YAW
            : 0;
      const targetPitch = rawInput.lookForward
        ? 0
        : rawInput.lookUp
          ? MAX_HEAD_PITCH
          : rawInput.lookDown
            ? -MAX_HEAD_PITCH
            : 0;
      const lookRate = targetYaw === 0 && targetPitch === 0 ? LOOK_RAMP_DOWN : LOOK_RAMP_UP;
      const lookBlend = Math.min(1, lookRate * SIM_DT);
      headYaw += (targetYaw - headYaw) * lookBlend;
      headPitch += (targetPitch - headPitch) * lookBlend;
      headLookRef.current.yaw = headYaw;
      headLookRef.current.pitch = headPitch;

      if (raw.brake > 0) {
        brakeLevel = Math.min(1, brakeLevel + BRAKE_ACCEL_RAMP_RATE * SIM_DT);
        accelLevel = 0;
      } else if (raw.acceleratedFlight > 0) {
        accelLevel = Math.min(1, accelLevel + BRAKE_ACCEL_RAMP_RATE * SIM_DT);
        brakeLevel = 0;
      } else {
        brakeLevel = Math.max(0, brakeLevel - BRAKE_ACCEL_RAMP_RATE * SIM_DT);
        accelLevel = Math.max(0, accelLevel - BRAKE_ACCEL_RAMP_RATE * SIM_DT);
      }
      brakeLevelRef.current = brakeLevel;
      accelLevelRef.current = accelLevel;

      // Smooth steer input - ramp up when holding, ramp down when released
      let steerLeftLevel = steerLeftLevelRef.current;
      let steerRightLevel = steerRightLevelRef.current;
      if (raw.steerLeft > 0) {
        steerLeftLevel = Math.min(1, steerLeftLevel + STEER_RAMP_UP * SIM_DT);
        steerRightLevel = Math.max(0, steerRightLevel - STEER_RAMP_DOWN * SIM_DT);
      } else if (raw.steerRight > 0) {
        steerRightLevel = Math.min(1, steerRightLevel + STEER_RAMP_UP * SIM_DT);
        steerLeftLevel = Math.max(0, steerLeftLevel - STEER_RAMP_DOWN * SIM_DT);
      } else {
        steerLeftLevel = Math.max(0, steerLeftLevel - STEER_RAMP_DOWN * SIM_DT);
        steerRightLevel = Math.max(0, steerRightLevel - STEER_RAMP_DOWN * SIM_DT);
      }
      steerLeftLevelRef.current = steerLeftLevel;
      steerRightLevelRef.current = steerRightLevel;

      const currentState = stateRef.current;
      inputsCache.steerLeft = steerLeftLevel;
      inputsCache.steerRight = steerRightLevel;
      inputsCache.brake = brakeLevel;
      inputsCache.acceleratedFlight = accelLevel;
      const envWithTerrain = {
        ...env,
        getGroundHeight: groundHeightAt,
      };
      const nextState = isPausedRef.current
        ? currentState
        : simulateStep(
            { ...currentState, inputs: inputsCache },
            SIM_DT,
            envWithTerrain
          );
      stateRef.current = nextState;

      syncCameraFromAircraft(
        scene,
        nextState,
        headLookRef.current,
        cameraModeRef.current,
        settingsRef.current.debugMode || isPausedRef.current
      );
      scene.renderer.render(scene.scene, scene.camera);

      if (
        !varioResumedRef.current &&
        (rawInput.brake ||
          rawInput.acceleratedFlight ||
          rawInput.left ||
          rawInput.right)
      ) {
        varioResumedRef.current = true;
        void vario.resume();
        void wind.resume();
      }
      const s = settingsRef.current;
      const lastVario = lastVarioConfigRef.current;
      if (
        lastVario.enabled !== s.varioEnabled ||
        lastVario.volume !== s.varioVolume
      ) {
        lastVario.enabled = s.varioEnabled;
        lastVario.volume = s.varioVolume;
        vario.setConfig(lastVario);
      }
      const lastWind = lastWindConfigRef.current;
      if (
        lastWind.enabled !== s.windEnabled ||
        lastWind.volume !== s.windVolume
      ) {
        lastWind.enabled = s.windEnabled;
        lastWind.volume = s.windVolume;
        wind.setConfig(lastWind);
      }
      const fs = deriveFlightState(nextState, groundHeightAt);
      if (isPausedRef.current) {
        vario.stop();
        wind.stop();
      } else if (fs === "airborne") {
        vario.update(nextState.verticalSpeed);
        wind.update(nextState.airspeed);
        const terrainSample = sampleTerrainState({
          x: nextState.position.x,
          z: nextState.position.z,
          worldY: nextState.position.y,
          getHeight: groundHeightAt,
        });
        const heightAboveGround = Math.max(0, terrainSample.altitudeAboveGround);
        maxAltitudeRef.current = Math.max(
          maxAltitudeRef.current,
          heightAboveGround
        );
        const dist = Math.sqrt(
          (nextState.position.x - level.launch.x) ** 2 +
            (nextState.position.z - level.launch.z) ** 2
        );
        maxDistanceRef.current = Math.max(maxDistanceRef.current, dist);
      } else {
        vario.stop();
        wind.stop();
      }
      const gateProgress = checkGateProgress(
        nextState.position.x,
        nextState.position.z,
        level.gates,
        gatePassedRef.current
      );
      gatePassedRef.current = gateProgress.passed;

      if (didJustLand(currentState, nextState, groundHeightAt)) {
        const airtime = (performance.now() - launchTimeRef.current) / 1000;
        const sink = nextState.touchdownSink ?? 2;
        const quality = classifyLandingQuality(sink);
        setScoreSummary({
          airtimeSeconds: airtime,
          maxAltitude: maxAltitudeRef.current,
          distanceFromLaunch: maxDistanceRef.current,
          landingQuality: quality,
        });
        playLandingSound(quality, sink, {
          enabled: settingsRef.current.landingEnabled,
          volume: settingsRef.current.landingVolume,
        });
      }

      const now = performance.now();
      if (now - lastHudUpdateRef.current >= HUD_UPDATE_INTERVAL_MS) {
        lastHudUpdateRef.current = now;
        setHudData(
          mapAircraftToHudData(nextState, env, {
            getGroundHeight: groundHeightAt,
            landingZone: level.landingZone,
            gateProgress: {
              passed: gateProgress.passed,
              total: level.gates.length,
            },
          })
        );
        setFlightState(fs);
        setPauseDebugSnapshot(
          buildPauseDebugSnapshot(nextState, groundHeightAt, fs, cameraModeRef.current)
        );
        setHudInputDebug(
          settingsRef.current.debugMode
            ? mapInputsToDebug({
                steerLeft: steerLeftLevelRef.current,
                steerRight: steerRightLevelRef.current,
                brake: brakeLevelRef.current,
                acceleratedFlight: accelLevelRef.current,
              })
            : null
        );
        setHudEnvDebug(
          settingsRef.current.debugMode
            ? {
                windX: env.wind.x,
                windZ: env.wind.z,
                thermalLift:
                  getThermalLift(
                    nextState.position.x,
                    nextState.position.z,
                    env.thermals
                  ) +
                  getRidgeLift(
                    nextState.position.x,
                    nextState.position.z,
                    env.ridgeLift,
                    env.wind
                  ),
              }
            : null
        );
        setHudTuningDebug(
          settingsRef.current.debugMode
            ? (() => {
                const terrainSample = sampleTerrainState({
                  x: nextState.position.x,
                  z: nextState.position.z,
                  worldY: nextState.position.y,
                  getHeight: groundHeightAt,
                });
                const g = terrainSample.terrainHeight;
                const h = Math.max(0, terrainSample.altitudeAboveGround);
                return {
                  sinkTrim: SINK_AT_TRIM,
                  bankDeg: (nextState.bank * 180) / Math.PI,
                  inFlareZone: h <= FLARE_ALTITUDE && h > 0,
                  worldX: nextState.position.x,
                  worldY: nextState.position.y,
                  worldZ: nextState.position.z,
                  groundAt: g,
                  heightAboveGround: h,
                  collisionState: h === 0 ? "contact" : "airborne",
                };
              })()
            : null
        );
      }
    }
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (sceneRef.current && containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          resizeFpvScene(sceneRef.current, w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      vario.stop();
      wind.stop();
      scene.renderer.dispose();
      canvas.remove();
      sceneRef.current = null;
    };
  }, [level, env, groundHeightAt]);

  return (
    <div ref={containerRef} className="relative h-full w-full min-h-screen">
      <Hud
        data={hudData}
        inputDebug={hudInputDebug}
        envDebug={hudEnvDebug}
        tuningDebug={hudTuningDebug}
        debugMode={settings.debugMode}
        isPaused={isPaused}
      />
      <div className="pointer-events-none absolute bottom-4 left-6 font-mono text-[11px] text-white/60">
        ← → sturen | ↑ sneller | ↓ remmen | a/d w/x s kijk | P pauze | C FPV/TPV/Top
      </div>
      <div className="pointer-events-auto absolute right-4 top-4 flex flex-col gap-2">
        <div className="relative flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="rounded bg-white/20 px-3 py-1.5 font-mono text-xs font-medium text-white transition hover:bg-white/30"
            data-testid="pause-button"
          >
            {isPaused ? "Hervat" : "Pauze"}
          </button>
          <button
          type="button"
          onClick={() =>
            setCameraMode((m) =>
              m === "fpv" ? "tpv" : m === "tpv" ? "top" : "fpv"
            )
          }
          className="rounded bg-white/20 px-3 py-1.5 font-mono text-xs font-medium text-white transition hover:bg-white/30"
          data-testid="camera-toggle"
        >
          {cameraMode === "fpv" ? "TPV" : cameraMode === "tpv" ? "Top" : "FPV"}
        </button>
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className="rounded bg-white/15 px-3 py-1.5 font-mono text-xs text-white/80 transition hover:bg-white/25"
            data-testid="settings-button"
          >
            ⚙
          </button>
          {showSettings && !isPaused && flightState !== "landed" && (
            <div className="absolute right-0 top-full z-10 mt-1">
              <SettingsPanel
                settings={settings}
                onSettingsChange={(u) => setSettings((s) => ({ ...s, ...u }))}
                onClose={() => setShowSettings(false)}
                compact
              />
            </div>
          )}
        </div>
      </div>
      {isPaused && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/45 px-4 backdrop-blur-[2px]"
          data-testid="pause-overlay"
        >
          <p className="font-mono text-lg font-medium text-white/95">Pauze</p>
          <PauseDebugPanel snapshot={pauseDebugSnapshot} />
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="rounded bg-white/20 px-4 py-2 font-mono text-sm text-white transition hover:bg-white/30"
            >
              Hervat
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPaused(false);
                handleRestart();
              }}
              className="rounded bg-white/15 px-4 py-2 font-mono text-xs text-white/90 transition hover:bg-white/25"
            >
              Opnieuw
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className="rounded bg-white/10 px-4 py-2 font-mono text-xs text-white/80 transition hover:bg-white/20"
              data-testid="settings-toggle"
            >
              {showSettings ? "Instellingen verbergen" : "Instellingen"}
            </button>
          </div>
          {showSettings && (
            <SettingsPanel
              settings={settings}
              onSettingsChange={(u) => setSettings((s) => ({ ...s, ...u }))}
              onClose={() => setShowSettings(false)}
              compact
            />
          )}
        </div>
      )}
      {flightState === "landed" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          data-testid="landed-overlay"
        >
          <p className="mb-2 font-mono text-xl font-semibold text-white">
            Geland
          </p>
          {scoreSummary && (
            <div
              className="mb-4 flex flex-col gap-1 rounded bg-black/40 px-6 py-3 font-mono text-sm text-white/90"
              data-testid="landing-summary"
            >
              {scoreSummary.landingQuality && (
                <span
                  className={
                    scoreSummary.landingQuality === "smooth"
                      ? "text-emerald-400"
                      : scoreSummary.landingQuality === "hard"
                        ? "text-amber-400"
                        : "text-red-400"
                  }
                >
                  {scoreSummary.landingQuality === "smooth"
                    ? "Nette landing"
                    : scoreSummary.landingQuality === "hard"
                      ? "Harde landing"
                      : "Zware landing"}
                </span>
              )}
              <span>Vluchttijd: {formatAirtime(scoreSummary.airtimeSeconds)}</span>
              <span>Grootste hoogte: {Math.round(scoreSummary.maxAltitude)} m</span>
              <span>Afstand: {formatDistance(scoreSummary.distanceFromLaunch)}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRestart}
              className="rounded bg-white/20 px-6 py-2 font-mono text-sm font-medium text-white transition hover:bg-white/30"
              data-testid="restart-button"
            >
              Opnieuw
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className="rounded bg-white/10 px-4 py-2 font-mono text-xs text-white/80 transition hover:bg-white/20"
              data-testid="settings-toggle-landed"
            >
              {showSettings ? "Verbergen" : "Instellingen"}
            </button>
          </div>
          {showSettings && flightState === "landed" && (
            <SettingsPanel
              settings={settings}
              onSettingsChange={(u) => setSettings((s) => ({ ...s, ...u }))}
              onClose={() => setShowSettings(false)}
              compact
            />
          )}
        </div>
      )}
    </div>
  );
}
