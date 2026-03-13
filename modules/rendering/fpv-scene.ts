/**
 * FPV (first-person view) Three.js scene setup.
 * Stylized alpine environment with cohesive art direction.
 */
import * as THREE from "three";
import type { AircraftState } from "@/modules/flight-model/state";
import type { CameraMode } from "@/modules/rendering/types";
import type { LevelData } from "@/modules/world/level-types";
import type { WindVector } from "@/modules/world/types";
import { terrainHeightAt } from "@/modules/world/terrain";
import { SINK_AT_TRIM, TRIM_SPEED } from "@/modules/flight-model/tuning";
import { createTerrainMesh } from "./terrain-mesh";
import { createWindsockMesh } from "./windsock-mesh";
import { addWorldDecorToScene } from "./scene-decor";
import { SKY_GRADIENT, FOG_CONFIG, HEMISPHERE_CONFIG, SUN_CONFIG, FILL_CONFIG } from "./atmosphere-config";

export interface FpvScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  paraglider: THREE.Group;
  altitudeDebugLine: THREE.Line;
}

/** Base FOV (degrees) */
const BASE_FOV = 72;
const FOV_SPEED_RANGE = 4;

function hexToCss(hex: number): string {
  return "#" + hex.toString(16).padStart(6, "0");
}

/** Sky gradient texture: zenith (top) to horizon (bottom) for depth and horizon blend */
function createSkyGradientTexture(): THREE.CanvasTexture {
  const w = 2;
  const h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, hexToCss(SKY_GRADIENT.zenith));
  gradient.addColorStop(1, hexToCss(SKY_GRADIENT.horizon));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** Soft cloud texture for sky clouds */
function createCloudTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.3, "rgba(255,255,255,0.7)");
  g.addColorStop(0.55, "rgba(255,255,255,0.0)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** Add a few clouds to the sky */
function addSkyClouds(scene: THREE.Scene): void {
  const cloudTex = createCloudTexture();
  const mat = new THREE.MeshBasicMaterial({
    map: cloudTex,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const cloudPositions: [number, number, number, number, number][] = [
    [-80, 190, 90, 55, 32],
    [40, 200, 80, 50, 30],
    [0, 215, 100, 60, 34],
    [-50, 230, 85, 52, 30],
    [90, 225, 95, 58, 32],
  ];
  for (const [x, y, z, w, h] of cloudPositions) {
    const cloud = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      mat.clone()
    );
    cloud.position.set(x, y, z);
    cloud.rotation.y = Math.PI * 0.1;
    cloud.renderOrder = -10;
    scene.add(cloud);
  }
}

let thermalGradientTexture: THREE.CanvasTexture | null = null;

function getThermalGradientTexture(): THREE.CanvasTexture {
  if (thermalGradientTexture) return thermalGradientTexture;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0.0, "rgba(242, 194, 80, 0.95)");
  g.addColorStop(0.4, "rgba(242, 194, 80, 0.6)");
  g.addColorStop(0.75, "rgba(242, 194, 80, 0.18)");
  g.addColorStop(1.0, "rgba(242, 194, 80, 0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  thermalGradientTexture = tex;
  return tex;
}


export function createFpvScene(
  canvas: HTMLCanvasElement,
  level: LevelData,
  windOverride?: WindVector
): FpvScene {
  const scene = new THREE.Scene();
  scene.background = createSkyGradientTexture();
  scene.fog = new THREE.Fog(
    FOG_CONFIG.color,
    FOG_CONFIG.near,
    FOG_CONFIG.far
  );

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

  const hemi = new THREE.HemisphereLight(
    HEMISPHERE_CONFIG.skyColor,
    HEMISPHERE_CONFIG.groundColor,
    HEMISPHERE_CONFIG.intensity
  );
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(SUN_CONFIG.color, SUN_CONFIG.intensity);
  sun.position.set(
    SUN_CONFIG.position.x,
    SUN_CONFIG.position.y,
    SUN_CONFIG.position.z
  );
  sun.castShadow = false;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(FILL_CONFIG.color, FILL_CONFIG.intensity);
  fill.position.set(
    FILL_CONFIG.position.x,
    FILL_CONFIG.position.y,
    FILL_CONFIG.position.z
  );
  scene.add(fill);

  addSkyClouds(scene);

  // Terrain
  const terrain = createTerrainMesh();
  scene.add(terrain);

  // Shared decor from grounded world composition.
  addWorldDecorToScene(scene);

  // Landing zone — clear meadow tint, readable from approach
  const { landingZone } = level;
  const lzGroundY = terrainHeightAt(landingZone.x, landingZone.z);
  const landingZoneMesh = new THREE.Mesh(
    new THREE.CircleGeometry(landingZone.radius, 48),
    new THREE.MeshLambertMaterial({
      color: 0x4a8050,
      side: THREE.DoubleSide,
    })
  );
  landingZoneMesh.rotation.x = -Math.PI / 2;
  landingZoneMesh.position.set(landingZone.x, lzGroundY + 0.015, landingZone.z);
  scene.add(landingZoneMesh);

  const windsockWind = windOverride ?? level.wind;
  const windsock = createWindsockMesh(
    landingZone.x,
    landingZone.z,
    windsockWind
  );
  scene.add(windsock);

  // Launch platform — natural stone, slightly warmer for composition
  const launch = level.launch;
  const launchGroundY = terrainHeightAt(launch.x, launch.z);
  const launchPlatform = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 13, 1.5, 20),
    new THREE.MeshLambertMaterial({ color: 0x6e6e66 })
  );
  launchPlatform.position.set(launch.x, launchGroundY + 0.75, launch.z);
  scene.add(launchPlatform);

  // Thermals - large columns around the mountain and on upper plateau, fog-aware
  for (const t of level.thermals) {
    const visualRadius = Math.max(t.radius * 1.05, 48);
    const visualHeight = 260;
    const thermalCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(
        visualRadius,
        visualRadius * 1.08,
        visualHeight,
        32
      ),
      new THREE.MeshLambertMaterial({
        color: 0xf2c270,
        transparent: true,
        opacity: 0.42,
        alphaTest: 0.1,
        depthWrite: true,
        fog: true,
      })
    );
    thermalCylinder.position.set(t.x, visualHeight / 2, t.z);
    thermalCylinder.renderOrder = 0;
    scene.add(thermalCylinder);

    // Extra: vlakke gradient-vlek op de grond voor top view leesbaarheid.
    const gradientTex = getThermalGradientTexture();
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(visualRadius * 0.98, 64),
      new THREE.MeshBasicMaterial({
        map: gradientTex,
        transparent: true,
        depthWrite: false,
        depthTest: true,
      })
    );
    const groundY = terrainHeightAt(t.x, t.z) + 0.45;
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(t.x, groundY, t.z);
    disc.renderOrder = 1;
    scene.add(disc);
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
      new THREE.MeshLambertMaterial({ color: 0x6a6a62 })
    );
    ridgeWall.position.set(ridgeMidX, ridgeGroundY + 5, ridgeMidZ);
    ridgeWall.rotation.y = -ridgeAngle;
    scene.add(ridgeWall);
  }

  // Level 01: valley settlement + mountain village on higher plateau
  if (level.id === "mountain-01") {
    addLevel01Settlement(scene);
    addMountainVillage(scene);
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

/** Level 01: village on tiles 45,46,47,61,62,63 — houses, tall buildings, roads */
function addMountainVillage(scene: THREE.Scene): void {
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x4a4038 });
  const roadSegments: [number, number, number, number, number][] = [
    // Horizontale weg over de bovenste rij tiles (45,46,47)
    [325, 162.5, 120, 5, 0],
    // Horizontale weg over de onderste rij tiles (61,62,63)
    [325, 227.5, 120, 5, 0],
    // Verticale verbinding tussen de rijen
    [275, 195, 80, 5, Math.PI / 2],
    [375, 195, 80, 5, Math.PI / 2],
  ];
  for (const [cx, cz, len, width, rotY] of roadSegments) {
    const ry = terrainHeightAt(cx, cz);
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.12, width),
      roadMat
    );
    road.position.set(cx, ry + 0.06, cz);
    road.rotation.y = rotY;
    scene.add(road);
  }

  // 20 huizen, verdeeld over de 6 gevraagde tiles (45,46,47,61,62,63)
  const houses: [number, number, number, number, number, number][] = [
    // Tile 45 (275, 162.5)
    [268, 158, 6, 5, 3.4, 0x7a6a52],
    [282, 166, 5.4, 4.2, 3.0, 0x6e5c4a],
    // Tile 46 (325, 162.5)
    [318, 158, 6.6, 5.2, 3.6, 0x6a5844],
    [332, 166, 5.2, 4.4, 3.1, 0x5c4e3c],
    // Tile 47 (375, 162.5)
    [368, 158, 6.0, 5.0, 3.5, 0x72604a],
    [382, 166, 5.0, 4.0, 3.0, 0x665644],
    // Tile 61 (275, 227.5)
    [268, 222, 5.6, 4.3, 3.2, 0x6e5e48],
    [282, 232, 6.2, 4.8, 3.4, 0x5a4e3e],
    // Tile 62 (325, 227.5)
    [318, 222, 5.4, 4.1, 3.0, 0x6d5a44],
    [332, 232, 5.8, 4.2, 3.3, 0x715c46],
    // Tile 63 (375, 227.5)
    [368, 222, 6.0, 5.0, 3.5, 0x6b5944],
    [382, 232, 5.2, 4.3, 3.1, 0x5f4e3d],
    // Extra huizen verspreid binnen de 6 tiles
    [272, 170, 5.8, 4.5, 3.3, 0x6c5a46],
    [328, 172, 6.4, 5.1, 3.6, 0x725f49],
    [378, 174, 5.6, 4.4, 3.2, 0x6a5743],
    [272, 238, 5.0, 4.0, 3.0, 0x5e4c3a],
    [328, 242, 6.2, 4.9, 3.5, 0x6f5b47],
    [378, 246, 5.4, 4.2, 3.1, 0x695643],
    [320, 252, 5.8, 4.6, 3.3, 0x6d5a47],
    [340, 256, 6.0, 5.0, 3.6, 0x735f4b],
  ];
  for (const [bx, bz, bw, bd, bh, color] of houses) {
    const by = terrainHeightAt(bx, bz);
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      new THREE.MeshLambertMaterial({ color })
    );
    building.position.set(bx, by + bh / 2, bz);
    scene.add(building);
  }

  const tallBuildings: [number, number, number, number, number, number][] = [
    [275, 162.5, 5.5, 5.5, 13, 0x5a5050], // tile 45
    [325, 162.5, 6.2, 5.2, 12, 0x4a4444], // tile 46
    [375, 162.5, 4.8, 4.8, 11, 0x524a48], // tile 47
    [300, 227.5, 5.4, 5.0, 13, 0x585050], // tile 61/62
    [350, 227.5, 5.8, 5.4, 12, 0x4e4644], // tile 62/63
  ];
  for (const [bx, bz, bw, bd, bh, color] of tallBuildings) {
    const by = terrainHeightAt(bx, bz);
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      new THREE.MeshLambertMaterial({ color })
    );
    building.position.set(bx, by + bh / 2, bz);
    scene.add(building);
  }
}

/** Level 01: bridge over fjord, road segments, sparse rural buildings — all grounded on terrain */
function addLevel01Settlement(scene: THREE.Scene): void {
  const bridgeCenterZ = 248;
  const bridgeHalfLength = 28;
  const yWest = terrainHeightAt(-bridgeHalfLength, bridgeCenterZ);
  const yEast = terrainHeightAt(bridgeHalfLength, bridgeCenterZ);
  const bridgeY = Math.max(yWest, yEast) + 1.2;
  const bridgeDeck = new THREE.Mesh(
    new THREE.BoxGeometry(bridgeHalfLength * 2, 0.5, 6),
    new THREE.MeshLambertMaterial({ color: 0x5a5a52 })
  );
  bridgeDeck.position.set(0, bridgeY, bridgeCenterZ);
  scene.add(bridgeDeck);

  const roadMat = new THREE.MeshLambertMaterial({ color: 0x4a4038 });
  const roadSegments: [number, number, number, number][] = [
    [-12, 235, 24, 8],
    [0, 298, 14, 8],
    [-70, 308, 12, 8],
  ];
  for (const [cx, cz, len, width] of roadSegments) {
    const ry = terrainHeightAt(cx, cz);
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.15, width),
      roadMat
    );
    road.position.set(cx, ry + 0.08, cz);
    road.rotation.y = cz > 280 ? Math.PI / 2 : 0;
    scene.add(road);
  }

  const buildingSpecs: [number, number, number, number, number, number][] = [
    [52, 306, 8, 5, 4, 0x6e5c4a],
    [-58, 310, 7, 4.5, 3.5, 0x6a5844],
    [78, 318, 6, 4, 3, 0x5c4e3c],
  ];
  for (const [bx, bz, bw, bd, bh, color] of buildingSpecs) {
    const by = terrainHeightAt(bx, bz);
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      new THREE.MeshLambertMaterial({ color })
    );
    building.position.set(bx, by + bh / 2, bz);
    scene.add(building);
  }
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

const PITCH_MAX = (15 * Math.PI) / 180;
/** Extra nose-down (rad) so horizon sits near vertical center in FPV */
const HORIZON_CENTER_OFFSET = (10 * Math.PI) / 180;
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
    const trimPitchOffset = Math.atan2(SINK_AT_TRIM, TRIM_SPEED);
    const pitchRelativeToTrim = basePitch - trimPitchOffset;
    const clampedPitch = Math.max(0, Math.min(PITCH_MAX, pitchRelativeToTrim));
    const pitch =
      clampedPitch + trimPitchOffset + HORIZON_CENTER_OFFSET + pitchAttitude + headLook.pitch;
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
