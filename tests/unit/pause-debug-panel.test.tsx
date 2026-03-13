import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PauseDebugPanel } from "@/components/PauseDebugPanel";

describe("PauseDebugPanel", () => {
  it("shows terrain, altitude, and collision details for screenshots", () => {
    render(
      <PauseDebugPanel
        snapshot={{
          worldX: 12.3,
          worldY: 100.8,
          worldZ: 310.6,
          terrainHeight: 100.8,
          altitudeAboveGround: 0,
          collisionState: "contact",
          airspeed: 0,
          verticalSpeed: 0,
          flightState: "landed",
          cameraMode: "fpv",
        }}
      />
    );

    expect(screen.getByTestId("pause-debug-panel")).toBeVisible();
    expect(screen.getByText("Wereldpositie")).toBeVisible();
    expect(screen.getByText("Terreinhoogte")).toBeVisible();
    expect(screen.getByText("ALT boven grond")).toBeVisible();
    expect(screen.getByText("Collision")).toBeVisible();
    expect(screen.getByText("ALT = worldY - terrainHeight")).toBeVisible();
    expect(screen.getAllByText("contact")).toHaveLength(2);
  });
});
