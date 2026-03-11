/**
 * FPV (first-person view) Three.js scene setup.
 * Camera placed at pilot eye position, looking along flight path.
 */
import * as THREE from "three";
import type { AircraftState } from "@/modules/flight-model/state";
import { LAUNCH_CONFIG, DEFAULT_THERMALS } from "@/modules/world/config";

export interface FpvScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** Paraglider mesh (wing + harness), visible only in TPV */
  paraglider: THREE.Group;
}

/** Ground plane size - must be large enough for extended flight */
const GROUND_SIZE = 2000;

/** Base FOV (degrees) - paraglider pilot view */
const BASE_FOV = 72;
/** FOV increase at high speed for sensation (degrees) */
const FOV_SPEED_RANGE = 4;

export function createFpvScene(canvas: HTMLCanvasElement): FpvScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue
  // Fog ver weg: thermiekzuilen blijven zichtbaar als je omdraait
  scene.fog = new THREE.Fog(0x87ceeb, 900, 2200);

  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(BASE_FOV, aspect, 0.1, 5000);
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

  // Launch area - ground-level marker (platform in lucht veroorzaakte donker artifact)
  const launchPlatform = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 18, 2, 16),
    new THREE.MeshLambertMaterial({ color: 0x4a7c59 })
  );
  launchPlatform.position.set(LAUNCH_CONFIG.x, 1, LAUNCH_CONFIG.z);
  scene.add(launchPlatform);

  // Thermal zones - visuele radius = physics radius (anders zie je lift maar krijg je geen)
  for (const t of DEFAULT_THERMALS) {
    const visualRadius = t.radius;
    const visualHeight = 180;
    const thermalCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(
        visualRadius,
        visualRadius * 1.15,
        visualHeight,
        32
      ),
      new THREE.MeshBasicMaterial({
        color: 0xff7700,
        transparent: true,
        opacity: 0.6,
        alphaTest: 0.2,
        depthWrite: true,
        fog: false,
      })
    );
    thermalCylinder.position.set(t.x, visualHeight / 2, t.z);
    thermalCylinder.renderOrder = 0;
    scene.add(thermalCylinder);
  }

  // Reference markers - sparse grid for orientation (reduced for performance)
  const addPillar = (x: number, y: number, z: number, color: number, height = 20) => {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 4, height, 8),
      new THREE.MeshLambertMaterial({ color })
    );
    pillar.position.set(x, y + height / 2, z);
    scene.add(pillar);
  };
  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
  const spacing = 200;
  const extent = 400;
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

  // Paraglider mesh: wing + harness, for TPV
  const paraglider = createParagliderMesh();
  paraglider.visible = false;
  scene.add(paraglider);

  return { scene, camera, renderer, paraglider };
}

function createParagliderMesh(): THREE.Group {
  const group = new THREE.Group();

  // Wing - flat plane (paraglider wing from behind)
  const wing = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 1.2),
    new THREE.MeshLambertMaterial({
      color: 0x3366cc,
      side: THREE.DoubleSide,
    })
  );
  wing.rotation.x = Math.PI / 2; // horizontal
  wing.position.set(0, 2.2, -0.3);
  group.add(wing);

  // Harness (pilot)
  const harness = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.9, 0.35),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  );
  harness.position.set(0, 0.45, 0);
  group.add(harness);

  // Risers (simple lines from wing to harness)
  const riserMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const riserGeom = new THREE.CylinderGeometry(0.02, 0.02, 1.8, 4);
  for (const side of [-1, 1]) {
    const r = new THREE.Mesh(riserGeom, riserMat);
    r.position.set(side * 0.6, 1.1, -0.15);
    r.rotation.x = Math.PI / 2;
    group.add(r);
  }

  return group;
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

/** TPV camera: distance behind glider */
const TPV_DISTANCE = 18;
/** TPV camera: height offset above glider */
const TPV_HEIGHT = 6;

/**
 * Sync camera and paraglider from aircraft state.
 * FPV: pilot eye view with head look.
 * TPV: camera behind and above glider, paraglider visible.
 */
export function syncCameraFromAircraft(
  scene: FpvScene,
  state: AircraftState,
  headLook: HeadLook = { yaw: 0, pitch: 0 },
  cameraMode: "fpv" | "tpv" = "fpv"
): void {
  const { position, heading, velocity, bank, pitchAttitude } = state;

  // Update paraglider mesh
  scene.paraglider.visible = cameraMode === "tpv";
  if (cameraMode === "tpv") {
    scene.paraglider.position.set(position.x, position.y + 0.5, position.z);
    scene.paraglider.rotation.order = "YXZ";
    scene.paraglider.rotation.set(pitchAttitude, heading, -bank);
  }

  const eyeY = position.y + EYE_HEIGHT;

  if (cameraMode === "fpv") {
    scene.camera.position.set(position.x, eyeY, position.z);

    // Subtle FOV increase at higher speed for sensation
    const speedNorm = Math.min(1, state.airspeed / 14);
    scene.camera.fov = BASE_FOV + speedNorm * FOV_SPEED_RANGE;
    scene.camera.updateProjectionMatrix();

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
    scene.camera.rotateOnAxis(new THREE.Vector3(0, 0, -1), -bank);
  } else {
    // TPV: fixed FOV, camera behind and above
    scene.camera.fov = BASE_FOV;
    scene.camera.updateProjectionMatrix();
    const backX = -Math.sin(heading);
    const backZ = -Math.cos(heading);
    const camX = position.x + backX * TPV_DISTANCE;
    const camZ = position.z + backZ * TPV_DISTANCE;
    const camY = position.y + TPV_HEIGHT;
    scene.camera.position.set(camX, camY, camZ);
    scene.camera.lookAt(position.x, position.y + 1.5, position.z);
  }
}

/** Get current pitch (radians) for debug - derived from look direction */
export function getCameraPitchFromState(state: AircraftState): number {
  const { velocity } = state;
  const horizontalSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2) || 1;
  const pitch = Math.atan2(-velocity.y, horizontalSpeed);
  return Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
}
