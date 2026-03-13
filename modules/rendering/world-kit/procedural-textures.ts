/**
 * World kit - procedural tileable textures for alpine world.
 * Used when image assets are not present; keeps pipeline asset-driven.
 * All textures are tileable (repeat) and match ART_DIRECTION palette.
 * In environments without canvas 2D (e.g. Vitest), returns a small DataTexture placeholder.
 */

import * as THREE from "three";

const TILE_SIZE = 256;

/** True when document and canvas 2D context are available (browser). */
export function canCreateCanvasTextures(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  return canvas.getContext("2d") !== null;
}

/** 1x1 DataTexture placeholder when canvas 2D is unavailable (e.g. tests). */
function createPlaceholderTexture(hex: number): THREE.DataTexture {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  const data = new Uint8Array([r * 255, g * 255, b * 255, 255]);
  const tex = new THREE.DataTexture(data, 1, 1);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Tileable canvas texture with repeat wrapping */
function toThreeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Grass: blade-like vertical streaks, green tones (ART_DIRECTION 0x3d6b2f–0x4a7c3a) */
export function createProceduralGrassTexture(): THREE.CanvasTexture | THREE.DataTexture {
  if (!canCreateCanvasTextures()) return createPlaceholderTexture(0x3d6b2f);
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#3d6b2f";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  for (let y = 0; y < TILE_SIZE; y += 2) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const nx = (x / TILE_SIZE) * 2 * Math.PI;
      const ny = (y / TILE_SIZE) * 2 * Math.PI;
      const n = (hash(x * 0.1, y * 0.1) - 0.5) * 0.4 + (Math.sin(nx * 3 + ny * 2) * 0.5 + 0.5) * 0.3;
      const v = Math.round(80 + n * 60);
      const r = 0x3d + (v - 80);
      const g = 0x6b + (v - 80);
      const b = 0x2f + (v - 80) * 0.5;
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 2);
    }
  }
  for (let i = 0; i < 400; i++) {
    const x = (i * 37 + 11) % TILE_SIZE;
    const y = (i * 53 + 7) % TILE_SIZE;
    const len = 4 + (hash(i, i * 2) * 8) | 0;
    const bright = 0.15 + hash(i * 3, 0) * 0.2;
    ctx.strokeStyle = `rgba(74,124,58,${bright})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (hash(i, 1) - 0.5) * 4, y + len);
    ctx.stroke();
  }
  return toThreeTexture(canvas);
}

/** Earth: brown organic variation (ART_DIRECTION 0x6b5344–0x7d6354) */
export function createProceduralEarthTexture(): THREE.CanvasTexture | THREE.DataTexture {
  if (!canCreateCanvasTextures()) return createPlaceholderTexture(0x6b5344);
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const nx = x / TILE_SIZE;
      const ny = y / TILE_SIZE;
      const n =
        (hash(Math.floor(nx * 32), Math.floor(ny * 32)) - 0.5) * 0.25 +
        (hash(Math.floor(nx * 8), Math.floor(ny * 8)) - 0.5) * 0.2 +
        Math.sin(nx * 20 + ny * 17) * 0.08;
      const v = 128 + n * 80;
      const r = Math.round(0x6b * 0.4 + v * 0.4);
      const g = Math.round(0x53 * 0.4 + v * 0.35);
      const b = Math.round(0x44 * 0.4 + v * 0.3);
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return toThreeTexture(canvas);
}

/** Rock: grey grain and micro-cracks (ART_DIRECTION 0x5c5c5c–0x787878) */
export function createProceduralRockTexture(): THREE.CanvasTexture | THREE.DataTexture {
  if (!canCreateCanvasTextures()) return createPlaceholderTexture(0x5c5c5c);
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n =
        (hash(x, y) - 0.5) * 0.3 +
        (hash(Math.floor(x / 4), Math.floor(y / 4)) - 0.5) * 0.2 +
        Math.sin(x * 0.08 + y * 0.06) * 0.1;
      const v = 128 + n * 70;
      const r = Math.round(0x5c + (v - 128) * 0.3);
      const g = Math.round(0x5c + (v - 128) * 0.3);
      const b = Math.round(0x5c + (v - 128) * 0.35);
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  for (let i = 0; i < 60; i++) {
    const x0 = (i * 97 + 13) % TILE_SIZE;
    const y0 = (i * 61 + 7) % TILE_SIZE;
    const len = 3 + (hash(i, 0) * 12) | 0;
    const alpha = 0.03 + hash(i, 1) * 0.04;
    ctx.strokeStyle = `rgba(40,40,40,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + (hash(i, 2) - 0.5) * len * 2, y0 + len);
    ctx.stroke();
  }
  return toThreeTexture(canvas);
}

/** Scree: gravel-like grey-brown (ART_DIRECTION 0x6b6b5c–0x8a8a78) */
export function createProceduralScreeTexture(): THREE.CanvasTexture | THREE.DataTexture {
  if (!canCreateCanvasTextures()) return createPlaceholderTexture(0x6b6b5c);
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n =
        (hash(x, y) - 0.5) * 0.35 +
        (hash(Math.floor(x / 3), Math.floor(y / 3)) - 0.5) * 0.25;
      const v = 128 + n * 60;
      const r = Math.round(0x6b + (v - 128) * 0.25);
      const g = Math.round(0x6b + (v - 128) * 0.22);
      const b = Math.round(0x5c + (v - 128) * 0.35);
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  for (let i = 0; i < 800; i++) {
    const x = (hash(i, 0) * TILE_SIZE) | 0;
    const y = (hash(i, 1) * TILE_SIZE) | 0;
    const r = 1 + (hash(i, 2) * 2) | 0;
    const a = 0.04 + hash(i, 3) * 0.06;
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return toThreeTexture(canvas);
}

/** Terrain detail: subtle micro-variation (multiplies with vertex colors) */
export function createProceduralTerrainDetailTexture(): THREE.CanvasTexture | THREE.DataTexture {
  if (!canCreateCanvasTextures()) {
    const tex = createPlaceholderTexture(0xffffff);
    tex.repeat.set(14, 14);
    return tex;
  }
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n =
        Math.sin(x * 0.4 + y * 0.3) * 0.5 +
        Math.sin(x * 0.15) * Math.sin(y * 0.12) * 0.5 +
        (hash(x, y) - 0.5) * 0.2;
      const v = Math.round(128 + n * 28);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = toThreeTexture(canvas);
  tex.repeat.set(14, 14);
  return tex;
}

/** Bark: vertical striation, brown (ART_DIRECTION trunk) */
export function createProceduralBarkTexture(): THREE.CanvasTexture | THREE.DataTexture {
  if (!canCreateCanvasTextures()) return createPlaceholderTexture(0x382a22);
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  const base = "#382a22";
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  for (let x = 0; x < TILE_SIZE; x++) {
    for (let y = 0; y < TILE_SIZE; y++) {
      const stripe = Math.sin((x / TILE_SIZE) * 40 + hash(x, y) * 4) * 0.5 + 0.5;
      const v = 0.75 + stripe * 0.25 + (hash(Math.floor(x / 8), y) - 0.5) * 0.15;
      const r = Math.round(0x38 * v);
      const g = Math.round(0x2a * v);
      const b = Math.round(0x22 * v);
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return toThreeTexture(canvas);
}

/** Foliage: conifer green with needle-like variation */
export function createProceduralFoliageTexture(): THREE.CanvasTexture | THREE.DataTexture {
  if (!canCreateCanvasTextures()) return createPlaceholderTexture(0x2a4a2e);
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#2a4a2e";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n =
        (hash(x, y) - 0.5) * 0.2 +
        (hash(Math.floor(x / 6), Math.floor(y / 6)) - 0.5) * 0.25 +
        Math.sin(x * 0.1 + y * 0.12) * 0.08;
      const v = 0.8 + n;
      const r = Math.round(0x2a * v);
      const g = Math.round(0x4a * v);
      const b = Math.round(0x2e * v);
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return toThreeTexture(canvas);
}

/** Rock default: same as terrain rock, tileable */
export function createProceduralRockDefaultTexture(): THREE.CanvasTexture | THREE.DataTexture {
  return createProceduralRockTexture();
}

/** Water surface: deep blue with subtle variation (ART_DIRECTION 0x2a5a7a) */
export function createProceduralWaterTexture(): THREE.CanvasTexture | THREE.DataTexture {
  if (!canCreateCanvasTextures()) return createPlaceholderTexture(0x2a5a7a);
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const nx = x / TILE_SIZE;
      const ny = y / TILE_SIZE;
      const n =
        (hash(Math.floor(nx * 24), Math.floor(ny * 24)) - 0.5) * 0.08 +
        Math.sin(nx * 12 + ny * 10) * 0.03;
      const v = 1 + n;
      const r = Math.round(0x2a * v);
      const g = Math.round(0x5a * v);
      const b = Math.round(0x7a * v);
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return toThreeTexture(canvas);
}

/** Shore: grass-to-water transition green (ART_DIRECTION 0x4a6b3a) */
export function createProceduralShoreTexture(): THREE.CanvasTexture | THREE.DataTexture {
  if (!canCreateCanvasTextures()) return createPlaceholderTexture(0x4a6b3a);
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = (hash(x, y) - 0.5) * 0.15 + (hash(Math.floor(x / 5), Math.floor(y / 5)) - 0.5) * 0.1;
      const v = 0.9 + n;
      const r = Math.round(0x4a * v);
      const g = Math.round(0x6b * v);
      const b = Math.round(0x3a * v);
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return toThreeTexture(canvas);
}
