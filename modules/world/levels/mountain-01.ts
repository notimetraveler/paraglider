/**
 * Mountain level - first playable scenic level.
 * Launch from the first mountain, glide across the valley, meet the second mountain.
 */

import type { LevelData } from "../level-types";

export const MOUNTAIN_01: LevelData = {
  id: "mountain-01",
  name: "Bergvallei",
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
    z: 220,
    radius: 70,
  },
  wind: {
    x: 0,
    z: 0,
  },
  thermals: [],
  ridgeLift: [],
  gates: [
    { x: 0, z: 170, radius: 45, order: 0 },
    { x: 0, z: 260, radius: 50, order: 1 },
    { x: 0, z: 340, radius: 45, order: 2 },
  ],
};
