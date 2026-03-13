/**
 * Level 01 — Fjordvallei (alpine fjord valley).
 * Scenic mountain launch, valley corridor, fjord/lake, forested slopes, bridge, settlement, landing field.
 * Aligned with docs/LEVEL_01_WORLD_SPEC.md and docs/ART_DIRECTION.md.
 */

import type { LevelData } from "../level-types";

export const MOUNTAIN_01: LevelData = {
  id: "mountain-01",
  name: "Fjordvallei",
  difficulty: "easy",
  launch: {
    x: 0,
    y: 0,
    z: 100,
    heading: 0,
    initialSpeed: 8,
  },
  landingZone: {
    x: 0,
    z: 312,
    radius: 70,
  },
  wind: {
    x: -2,
    z: 0,
  },
  thermals: [
    // Thermiekzuil 1: precies over tiles 12,13,14,29,30,31.
    // Tile-centra rond (300, 65), straal net groot genoeg voor deze 6 tiles.
    { x: 300, z: 65, radius: 85, strength: 3.2 },
    // Thermiekzuil 2: berghelling bij tiles 2,3,18,19.
    // Tilecentra: (-275,32.5), (-225,32.5), (-275,97.5), (-225,97.5) -> midden rond (-250,65).
    { x: -250, z: 65, radius: 70, strength: 2.8 },
  ],
  ridgeLift: [],
  gates: [],
};
