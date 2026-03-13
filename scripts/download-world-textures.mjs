#!/usr/bin/env node
/**
 * Download CC0 terrain (and optional other) textures from AmbientCG and place
 * them in public/assets/world/ for the Level 01 alpine environment.
 * Licenses: CC0 (see docs/superpowers/specs/2026-03-13-alpine-asset-sourcing.md).
 *
 * Usage: node scripts/download-world-textures.mjs
 * Requires: npm install -D adm-zip (for zip extraction).
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_BASE = path.join(ROOT, "public", "assets", "world");

const AMBIENTCG_API = "https://ambientcg.com/api/v2/full_json";

const ASSET_MAP = [
  { assetId: "Ground037", dir: "terrain", file: "grass.jpg" },
  { assetId: "Ground030", dir: "terrain", file: "earth.jpg" },
  { assetId: "Rock032", dir: "terrain", file: "rock.jpg" },
  { assetId: "Rock032", dir: "terrain", file: "scree.jpg" },
  { assetId: "Ground037", dir: "terrain", file: "detail.jpg" },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function downloadToBuffer(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function getDownloadLink(assetId) {
  const url = `${AMBIENTCG_API}?id=${encodeURIComponent(assetId)}&include=downloadData`;
  const data = await fetchJson(url);
  const asset = data?.foundAssets?.[0];
  if (!asset) throw new Error(`Asset not found: ${assetId}`);
  const zipDownloads =
    asset?.downloadFolders?.default?.downloadFiletypeCategories?.zip?.downloads;
  if (!zipDownloads?.length) throw new Error(`No zip downloads: ${assetId}`);
  const oneK = zipDownloads.find((d) => d.attribute === "1K-JPG");
  const link = (oneK || zipDownloads[0]).downloadLink;
  if (!link) throw new Error(`No download link: ${assetId}`);
  return link;
}

async function extractColorJpgFromZip(zipBuffer) {
  let AdmZip;
  try {
    AdmZip = (await import("adm-zip")).default;
  } catch {
    throw new Error(
      "Need adm-zip for extraction. Run: npm install -D adm-zip"
    );
  }
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const colorEntry = entries.find(
    (e) =>
      e.entryName.includes("Color") &&
      e.entryName.toLowerCase().endsWith(".jpg")
  );
  if (!colorEntry) throw new Error("No *Color.jpg in zip");
  return zip.readFile(colorEntry);
}

async function downloadOne({ assetId, dir, file }) {
  const outDir = path.join(OUT_BASE, dir);
  const outPath = path.join(outDir, file);
  ensureDir(outDir);

  const link = await getDownloadLink(assetId);
  console.log(`Downloading ${assetId} (1K-JPG) -> ${dir}/${file} ...`);
  const zipBuffer = await downloadToBuffer(link);
  const colorJpg = await extractColorJpgFromZip(zipBuffer);
  writeFileSync(outPath, colorJpg);
  console.log(`  -> ${outPath}`);
}

async function main() {
  console.log("World texture download (AmbientCG CC0) -> public/assets/world/\n");
  const seen = new Set();
  for (const entry of ASSET_MAP) {
    const key = `${entry.dir}/${entry.file}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      await downloadOne(entry);
    } catch (e) {
      console.error(`  Error: ${e.message}`);
    }
  }
  console.log("\nDone. Restart dev server and hard-refresh to see textures.");
}

main();
