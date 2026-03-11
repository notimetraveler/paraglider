import { describe, it, expect } from "vitest";
import {
  createEmptyInputState,
  rawToControlInputs,
  isControlKey,
  getControlForKey,
} from "@/modules/input";

describe("input layer", () => {
  describe("createEmptyInputState", () => {
    it("returns all false", () => {
      const state = createEmptyInputState();
      expect(state.left).toBe(false);
      expect(state.right).toBe(false);
      expect(state.brake).toBe(false);
      expect(state.acceleratedFlight).toBe(false);
    });
  });

  describe("rawToControlInputs", () => {
    it("maps brake key to brake input", () => {
      const raw = createEmptyInputState();
      raw.brake = true;
      const controls = rawToControlInputs(raw);
      expect(controls.brake).toBe(1);
    });
    it("maps up key to acceleratedFlight input", () => {
      const raw = createEmptyInputState();
      raw.acceleratedFlight = true;
      const controls = rawToControlInputs(raw);
      expect(controls.acceleratedFlight).toBe(1);
    });
    it("maps left/right to steer inputs", () => {
      const raw = createEmptyInputState();
      raw.left = true;
      expect(rawToControlInputs(raw).steerLeft).toBe(1);
      raw.left = false;
      raw.right = true;
      expect(rawToControlInputs(raw).steerRight).toBe(1);
    });
  });

  describe("isControlKey", () => {
    it("recognizes ArrowDown as brake", () => {
      expect(isControlKey("ArrowDown")).toBe(true);
      expect(getControlForKey("ArrowDown")).toBe("brake");
    });
    it("recognizes ArrowUp as acceleratedFlight", () => {
      expect(isControlKey("ArrowUp")).toBe(true);
      expect(getControlForKey("ArrowUp")).toBe("acceleratedFlight");
    });
  });
});
