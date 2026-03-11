/**
 * FPV (first-person view) Three.js scene setup.
 * Camera placed at pilot eye position, looking along flight path.
 */
import * as THREE from "three";
import type { AircraftState } from "@/modules/flight-model/state";
import { LAUNCH_CONFIG } from "@/modules/world/config";

export interface FpvScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

/** Ground plane size - must be large enough for extended flight */
const GROUND_SIZE = 2000;

export function createFpvScene(canvas: HTMLCanvasElement): FpvScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue

  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 5000);
  camera.position.set(0, 2, 0);
  camera.lookAt(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
    new THREE.MeshLambertMaterial({ color: 0x228b22, side: THREE.DoubleSide })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 0);
  scene.add(ground);

  // Launch area - elevated platform at spawn
  const launchPlatform = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 18, 2, 16),
    new THREE.MeshLambertMaterial({ color: 0x4a7c59 })
  );
  launchPlatform.position.set(
    LAUNCH_CONFIG.x,
    LAUNCH_CONFIG.y + 1,
    LAUNCH_CONFIG.z
  );
  scene.add(launchPlatform);

  // Debug: reference objects - grid across large area for flight testing
  const addPillar = (x: number, y: number, z: number, color: number, height = 25) => {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 5, height, 8),
      new THREE.MeshLambertMaterial({ color })
    );
    pillar.position.set(x, y + height / 2, z);
    scene.add(pillar);
  };
  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
  const spacing = 100;
  const extent = 700;
  for (let x = -extent; x <= extent; x += spacing) {
    for (let z = -extent; z <= extent; z += spacing) {
      const idx = (Math.floor(x / spacing) + Math.floor(z / spacing)) % colors.length;
      addPillar(x, 0, z, colors[Math.abs(idx)]);
    }
  }

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(100, 200, 100);
  scene.add(directional);

  return { scene, camera, renderer };
}

export function resizeFpvScene(
  scene: FpvScene,
  width: number,
  height: number
): void {
  scene.camera.aspect = width / height;
  scene.camera.updateProjectionMatrix();
  scene.renderer.setSize(width, height);
}

/** Pitch limits (radians): min = look down, max = look up. Keeps horizon usable. */
const PITCH_MIN = (-25 * Math.PI) / 180;
const PITCH_MAX = (15 * Math.PI) / 180;
/** Pilot eye height above aircraft position - keeps ground visible when landed */
const EYE_HEIGHT = 1.5;

/** Head look offsets (radians) - applied on top of flight direction */
export interface HeadLook {
  yaw: number;   // left/right, max ±90°
  pitch: number; // up/down
}

/**
 * Sync FPV camera position and orientation from aircraft state.
 * Three.js uses Y-up; aircraft y is altitude.
 * Camera offset by EYE_HEIGHT so pilot sees ground when landed.
 * Applies bank for realistic turning feel and optional head look.
 */
export function syncCameraFromAircraft(
  scene: FpvScene,
  state: AircraftState,
  headLook: HeadLook = { yaw: 0, pitch: 0 }
): void {
  const { position, heading, velocity, bank, pitchAttitude } = state;

  const eyeY = position.y + EYE_HEIGHT;
  scene.camera.position.set(position.x, eyeY, position.z);

  const horizontalSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2) || 1;
  const basePitch = Math.atan2(-velocity.y, horizontalSpeed);
  const clampedPitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, basePitch));
  const pitch = clampedPitch + pitchAttitude + headLook.pitch;

  const effectiveHeading = heading + headLook.yaw;
  const lookDistance = 100;
  const forwardX = Math.sin(effectiveHeading);
  const forwardZ = Math.cos(effectiveHeading);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  scene.camera.lookAt(
    position.x + forwardX * cosPitch * lookDistance,
    eyeY - sinPitch * lookDistance,
    position.z + forwardZ * cosPitch * lookDistance
  );

  // Apply bank (roll) - horizon tilts when turning.
  // Left turn (positive bank) = left wing down = horizon tilts left. Negate for correct visual.
  scene.camera.rotateOnAxis(new THREE.Vector3(0, 0, -1), -bank);
}

/** Get current pitch (radians) for debug - derived from look direction */
export function getCameraPitchFromState(state: AircraftState): number {
  const { velocity } = state;
  const horizontalSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2) || 1;
  const pitch = Math.atan2(-velocity.y, horizontalSpeed);
  return Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
}
