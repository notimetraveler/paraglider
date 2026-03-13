/**
 * FPV (first-person view) Three.js scene setup.
 * Stylized alpine environment with cohesive art direction.
 */
import * as THREE from "three";
import type { AircraftState } from "@/modules/flight-model/state";
import type { CameraMode } from "@/modules/rendering/types";
import type { LevelData } from "@/modules/world/level-types";
import { terrainHeightAt } from "@/modules/world/terrain";
import { createTerrainMesh } from "./terrain-mesh";
import { createGateMarkerMesh } from "./gate-mesh";
import { createWindsockMesh } from "./windsock-mesh";
import {
  createWaterMesh,
  addTreesToScene,
  createRockLandmark,
} from "./scene-decor";

export interface FpvScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  paraglider: THREE.Group;
  altitudeDebugLine: THREE.Line;
}

/** Alpine sky - soft blue with slight warmth */
const SKY_COLOR = 0x7eb3d4;
const FOG_COLOR = 0x8fc4e0;
const FOG_NEAR = 600;
const FOG_FAR = 2400;

/** Base FOV (degrees) */
const BASE_FOV = 72;
const FOV_SPEED_RANGE = 4;

export function createFpvScene(canvas: HTMLCanvasElement, level: LevelData): FpvScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLOR);
  scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

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

  // Lighting - alpine morning feel
  const hemi = new THREE.HemisphereLight(0x9ec4e8, 0x4a5a3a, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff5e6, 0.75);
  sun.position.set(120, 280, 80);
  sun.castShadow = false;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xb8d4e8, 0.2);
  fill.position.set(-80, 100, -60);
  scene.add(fill);

  // Terrain
  const terrain = createTerrainMesh();
  scene.add(terrain);

  // Water
  scene.add(createWaterMesh());

  // Trees - biome-aware clusters
  addTreesToScene(scene);

  // Rock landmarks for orientation
  scene.add(createRockLandmark(95, 110, 8));
  scene.add(createRockLandmark(170, 190, 6));

  // Landing zone - subtle grass tint
  const { landingZone } = level;
  const lzGroundY = terrainHeightAt(landingZone.x, landingZone.z);
  const landingZoneMesh = new THREE.Mesh(
    new THREE.CircleGeometry(landingZone.radius, 48),
    new THREE.MeshLambertMaterial({
      color: 0x3a6b42,
      side: THREE.DoubleSide,
    })
  );
  landingZoneMesh.rotation.x = -Math.PI / 2;
  landingZoneMesh.position.set(landingZone.x, lzGroundY + 0.015, landingZone.z);
  scene.add(landingZoneMesh);

  const windsock = createWindsockMesh(landingZone.x, landingZone.z, level.wind);
  scene.add(windsock);

  // Launch platform - natural stone
  const launch = level.launch;
  const launchGroundY = terrainHeightAt(launch.x, launch.z);
  const launchPlatform = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 13, 1.5, 20),
    new THREE.MeshLambertMaterial({ color: 0x5a5a52 })
  );
  launchPlatform.position.set(launch.x, launchGroundY + 0.75, launch.z);
  scene.add(launchPlatform);

  // Thermals - softer, atmospheric
  for (const t of level.thermals) {
    const visualRadius = t.radius;
    const visualHeight = 160;
    const thermalCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(
        visualRadius,
        visualRadius * 1.12,
        visualHeight,
        32
      ),
      new THREE.MeshBasicMaterial({
        color: 0xf0a050,
        transparent: true,
        opacity: 0.45,
        alphaTest: 0.15,
        depthWrite: true,
        fog: false,
      })
    );
    thermalCylinder.position.set(t.x, visualHeight / 2, t.z);
    thermalCylinder.renderOrder = 0;
    scene.add(thermalCylinder);
  }

  // Ridge - natural rock formation, grounded on terrain
  for (const r of level.ridgeLift) {
    const ridgeLen = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
    const ridgeMidX = (r.x1 + r.x2) / 2;
    const ridgeMidZ = (r.z1 + r.z2) / 2;
    const ridgeGroundY = terrainHeightAt(ridgeMidX, ridgeMidZ);
    const ridgeAngle = Math.atan2(r.z2 - r.z1, r.x2 - r.x1);
    const ridgeWall = new THREE.Mesh(
      new THREE.BoxGeometry(ridgeLen, 10, r.width * 1.8),
      new THREE.MeshLambertMaterial({ color: 0x5c5c54 })
    );
    ridgeWall.position.set(ridgeMidX, ridgeGroundY + 5, ridgeMidZ);
    ridgeWall.rotation.y = -ridgeAngle;
    scene.add(ridgeWall);
  }

  // Gates - readable but integrated
  for (const g of level.gates) {
    scene.add(createGateMarkerMesh(g, terrainHeightAt));
  }

  const paraglider = createParagliderMesh();
  paraglider.visible = false;
  scene.add(paraglider);

  const altitudeDebugLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]),
    new THREE.LineBasicMaterial({
      color: 0xffb347,
      transparent: true,
      opacity: 0.9,
    })
  );
  altitudeDebugLine.visible = false;
  scene.add(altitudeDebugLine);

  return { scene, camera, renderer, paraglider, altitudeDebugLine };
}

function createParagliderMesh(): THREE.Group {
  const group = new THREE.Group();
  const wing = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 1.2),
    new THREE.MeshLambertMaterial({
      color: 0x3366cc,
      side: THREE.DoubleSide,
    })
  );
  wing.rotation.x = Math.PI / 2;
  wing.position.set(0, 2.2, -0.3);
  group.add(wing);
  const harness = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.9, 0.35),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  );
  harness.position.set(0, 0.45, 0);
  group.add(harness);
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

/** Head look offsets (radians) - applied on top of flight direction */
export interface HeadLook {
  yaw: number;
  pitch: number;
}

const PITCH_MIN = (-25 * Math.PI) / 180;
const PITCH_MAX = (15 * Math.PI) / 180;
const EYE_HEIGHT = 1.5;
const TPV_DISTANCE = 18;
const TPV_HEIGHT = 6;
const TOP_VIEW_HEIGHT = 120;
const AXIS_Z = new THREE.Vector3(0, 0, -1);

/**
 * Sync camera and paraglider from aircraft state.
 */
export function syncCameraFromAircraft(
  scene: FpvScene,
  state: AircraftState,
  headLook: HeadLook = { yaw: 0, pitch: 0 },
  cameraMode: CameraMode = "fpv",
  showAltitudeDebugLine: boolean = false
): void {
  const { position, heading, velocity, bank, pitchAttitude } = state;
  const terrainY = terrainHeightAt(position.x, position.z);

  const linePositions = scene.altitudeDebugLine.geometry.attributes.position;
  linePositions.setXYZ(0, position.x, terrainY, position.z);
  linePositions.setXYZ(1, position.x, position.y, position.z);
  linePositions.needsUpdate = true;
  scene.altitudeDebugLine.visible = showAltitudeDebugLine;

  scene.paraglider.visible = cameraMode === "tpv" || cameraMode === "top";
  if (scene.paraglider.visible) {
    scene.paraglider.position.set(position.x, position.y + 0.5, position.z);
    scene.paraglider.rotation.order = "YXZ";
    scene.paraglider.rotation.set(pitchAttitude, heading, -bank);
  }

  const eyeY = position.y + EYE_HEIGHT;

  if (cameraMode === "fpv") {
    scene.camera.position.set(position.x, eyeY, position.z);
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
    scene.camera.rotateOnAxis(AXIS_Z, -bank);
  } else if (cameraMode === "top") {
    scene.camera.fov = BASE_FOV;
    scene.camera.updateProjectionMatrix();
    const camY = position.y + TOP_VIEW_HEIGHT;
    scene.camera.position.set(position.x, camY, position.z);
    scene.camera.lookAt(position.x, terrainY, position.z);
  } else {
    scene.camera.fov = BASE_FOV;
    scene.camera.updateProjectionMatrix();
    const backX = -Math.sin(heading);
    const backZ = -Math.cos(heading);
    scene.camera.position.set(
      position.x + backX * TPV_DISTANCE,
      position.y + TPV_HEIGHT,
      position.z + backZ * TPV_DISTANCE
    );
    scene.camera.lookAt(position.x, position.y + 1.5, position.z);
  }
}
