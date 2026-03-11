"use client";

import { useEffect, useRef, useState } from "react";
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
import { deriveFlightState } from "@/modules/game-session";
import type { FlightState } from "@/modules/flight-model/types";
import type { ControlInputs } from "@/modules/input";
import { mapAircraftToHudData, mapInputsToDebug } from "@/modules/hud";
import type { HudData, HudInputDebug } from "@/modules/hud";
import { useInput } from "./InputManager";
import { Hud } from "./Hud";

const SIM_DT = 1 / 60;
const MAX_HEAD_YAW = Math.PI / 2;
const MAX_HEAD_PITCH = (60 * Math.PI) / 180;
/** Look ramp: smooth like steer keys */
const LOOK_RAMP_UP = 0.45;
const LOOK_RAMP_DOWN = 0.35;
/** HUD update rate - throttle React re-renders */
const HUD_UPDATE_INTERVAL_MS = 66;

/**
 * Simulator shell - FPV-first 3D render container.
 * Simulation loop updates aircraft state per frame; camera follows aircraft.
 */
function useDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

export function SimulatorShell() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FpvScene | null>(null);
  const stateRef = useRef<AircraftState>(createLaunchState());
  const brakeLevelRef = useRef(0);
  const accelLevelRef = useRef(0);
  const steerLeftLevelRef = useRef(0);
  const steerRightLevelRef = useRef(0);
  const { raw, controls } = useInput();
  const controlsRef = useRef<ControlInputs>(controls);
  const rawRef = useRef(raw);
  const debugMode = useDebugMode();
  const debugModeRef = useRef(debugMode);
  useEffect(() => {
    debugModeRef.current = debugMode;
  }, [debugMode]);

  const [hudData, setHudData] = useState<HudData>(() =>
    mapAircraftToHudData(createLaunchState())
  );
  const [hudInputDebug, setHudInputDebug] = useState<HudInputDebug | null>(null);
  const [flightState, setFlightState] = useState<FlightState>("airborne");
  const lastHudUpdateRef = useRef(0);

  const handleRestart = () => {
    stateRef.current = createLaunchState();
    brakeLevelRef.current = 0;
    accelLevelRef.current = 0;
    steerLeftLevelRef.current = 0;
    steerRightLevelRef.current = 0;
    setHudData(mapAircraftToHudData(createLaunchState()));
    setFlightState("airborne");
  };

  useEffect(() => {
    controlsRef.current = controls;
    rawRef.current = raw;
  }, [raw, controls]);

  const headLookRef = useRef<HeadLook>({ yaw: 0, pitch: 0 });

  const BRAKE_ACCEL_RATE = 0.8;
  /** Steer ramp: slower than brake for smooth, controlled turns */
  const STEER_RAMP_UP = 0.45;
  const STEER_RAMP_DOWN = 0.35;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    container.prepend(canvas);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = createFpvScene(canvas);
    resizeFpvScene(scene, width, height);
    sceneRef.current = scene;

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
      headLookRef.current = { yaw: headYaw, pitch: headPitch };

      if (raw.brake > 0) {
        brakeLevel = Math.min(1, brakeLevel + BRAKE_ACCEL_RATE * SIM_DT);
        accelLevel = 0;
      } else if (raw.acceleratedFlight > 0) {
        accelLevel = Math.min(1, accelLevel + BRAKE_ACCEL_RATE * SIM_DT);
        brakeLevel = 0;
      } else {
        brakeLevel = Math.max(0, brakeLevel - BRAKE_ACCEL_RATE * SIM_DT);
        accelLevel = Math.max(0, accelLevel - BRAKE_ACCEL_RATE * SIM_DT);
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
      const nextState = simulateStep(
        {
          ...currentState,
          inputs: {
            steerLeft: steerLeftLevel,
            steerRight: steerRightLevel,
            brake: brakeLevel,
            acceleratedFlight: accelLevel,
          },
        },
        SIM_DT
      );
      stateRef.current = nextState;

      syncCameraFromAircraft(scene, nextState, headLookRef.current);
      scene.renderer.render(scene.scene, scene.camera);

      const now = performance.now();
      if (now - lastHudUpdateRef.current >= HUD_UPDATE_INTERVAL_MS) {
        lastHudUpdateRef.current = now;
        setHudData(mapAircraftToHudData(nextState));
        setFlightState(deriveFlightState(nextState));
        setHudInputDebug(
          debugModeRef.current
            ? mapInputsToDebug({
                steerLeft: steerLeftLevelRef.current,
                steerRight: steerRightLevelRef.current,
                brake: brakeLevelRef.current,
                acceleratedFlight: accelLevelRef.current,
              })
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
      scene.renderer.dispose();
      canvas.remove();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full min-h-screen">
      <Hud
        data={hudData}
        inputDebug={hudInputDebug}
        debugMode={debugMode}
      />
      <div className="pointer-events-none absolute bottom-4 left-6 font-mono text-[11px] text-white/60">
        ← → sturen | ↑ sneller | ↓ remmen | a/d w/x s kijk
      </div>
      {flightState === "landed" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
          data-testid="landed-overlay"
        >
          <p className="mb-4 font-mono text-xl font-semibold text-white">
            Geland
          </p>
          <button
            type="button"
            onClick={handleRestart}
            className="rounded bg-white/20 px-6 py-2 font-mono text-sm font-medium text-white transition hover:bg-white/30"
            data-testid="restart-button"
          >
            Opnieuw
          </button>
        </div>
      )}
    </div>
  );
}
