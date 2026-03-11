/**
 * Gate/checkpoint progress logic.
 * Pure functions for testability.
 */

import type { LevelGate } from "./level-types";

export interface GateProgress {
  /** Number of gates passed (0 to gates.length) */
  passed: number;
  /** Index of next gate to pass (gates.length when all passed) */
  nextIndex: number;
  /** True when all gates have been passed */
  complete: boolean;
}

/**
 * Check gate progress from aircraft position.
 * A gate is passed when aircraft enters its cylindrical zone.
 * Gates must be passed in order.
 */
export function checkGateProgress(
  x: number,
  z: number,
  gates: LevelGate[],
  currentPassed: number
): GateProgress {
  if (gates.length === 0) {
    return { passed: 0, nextIndex: 0, complete: true };
  }

  const nextIndex = Math.min(currentPassed, gates.length);
  if (nextIndex >= gates.length) {
    return { passed: gates.length, nextIndex: gates.length, complete: true };
  }

  const gate = gates[nextIndex];
  const dx = x - gate.x;
  const dz = z - gate.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist <= gate.radius) {
    return {
      passed: nextIndex + 1,
      nextIndex: nextIndex + 1,
      complete: nextIndex + 1 >= gates.length,
    };
  }

  return {
    passed: currentPassed,
    nextIndex,
    complete: false,
  };
}
