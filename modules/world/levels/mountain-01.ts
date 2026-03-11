/**
 * Mountain level - first playable scenic level.
 * Launch from mountain, fly through gates with thermals, land in valley.
 */

import type { LevelData } from "../level-types";
import { getMountainTerrainHeight } from "../terrain";

/** Launch height - on mountain slope */
const LAUNCH_HEIGHT = getMountainTerrainHeight(-15, 5) + 3;

export const MOUNTAIN_01: LevelData = {
  id: "mountain-01",
  name: "Bergvallei",
  difficulty: "easy",
  launch: {
    x: -15,
    y: LAUNCH_HEIGHT,
    z: 5,
    heading: 0.4, // Slight right toward first thermal
    initialSpeed: 8,
  },
  landingZone: {
    x: 150,
    z: 200,
    radius: 70,
  },
  wind: {
    x: -5,
    z: 0,
  },
  thermals: [
    { x: 35, z: 45, radius: 55, strength: 2.8 },
    { x: 90, z: 120, radius: 65, strength: 2.5 },
    { x: 140, z: 180, radius: 60, strength: 2.2 },
  ],
  ridgeLift: [
    {
      x1: 85,
      z1: 60,
      x2: 85,
      z2: 380,
      width: 50,
      strength: 1.5,
    },
  ],
  gates: [
    { x: 40, z: 50, radius: 45, order: 0 },
    { x: 95, z: 130, radius: 50, order: 1 },
    { x: 145, z: 190, radius: 45, order: 2 },
  ],
};
