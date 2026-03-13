# Architecture

Overview of the paraglider simulator modules and runtime flow.

## Module structure

```
modules/
  flight-model/     # Aircraft state, simulateStep, tuning
  rendering/        # Three.js scene, camera, paraglider mesh
  world/            # Config, lift (thermals, ridge), wind
  input/            # Keyboard mapping, control smoothing
  hud/              # HUD data mapping, formatting
  audio/            # Variometer, wind, landing sound
  game-session/     # Flight state (airborne/landed), scoring
  scoring/          # Score computation, formatting
  settings/         # Persistence (localStorage), types
```

## Responsibilities

| Module | Responsibility |
|--------|----------------|
| **flight-model** | Fixed-timestep physics; state updates; no React/DOM |
| **rendering** | Three.js scene, camera sync, terrain, thermals, ridge |
| **world** | Launch config, wind, thermals, ridge, landing zone |
| **input** | Key events → control inputs; smoothing in SimulatorShell |
| **hud** | mapAircraftToHudData, format helpers |
| **audio** | Shared AudioContext; vario, wind, landing; user-gesture resume |
| **game-session** | deriveFlightState, didJustLand, classifyLandingQuality |
| **scoring** | Session stats, formatting |
| **settings** | loadSettings, saveSettings, mergeWithDefaults; localStorage |

## Runtime flow

1. **SimulatorShell** (client): Mounts canvas, creates vario/wind, runs `requestAnimationFrame` loop.
2. **Animate loop**: Each frame: input smoothing → simulateStep → syncCamera → render → HUD update (every 50 ms).
3. **Settings**: Load from localStorage on mount (queueMicrotask); save on change.
4. **Audio**: Vario/wind update from sim state; resume after first user input (brake/accel/steer).

## Terrain source of truth

- `modules/world/terrain.ts` owns the canonical terrain height query (`terrainHeightAt` / shared terrain sampling helpers).
- Physics and UI must keep three values separate:
  - `worldY`
  - `terrainHeightAt(x, z)`
  - `ALT = worldY - terrainHeightAt(x, z)`
- Ground contact rule: when contact occurs, clamp `worldY` to terrain height and set `ALT` to exactly `0`.
- Collision, landing state, flare logic, HUD altitude, pause/debug overlays, and scoring must all derive from the same terrain sample.
- The rendered terrain mesh must use the same world coordinate orientation as the terrain sampler. If the mesh is mirrored or mapped differently from physics terrain, that is a correctness bug, not just a visual issue.

## Client/server boundaries

- **Simulator page**: `"use client"`; all heavy logic runs in browser.
- **Settings load**: `useEffect` + `queueMicrotask`; no localStorage on server.
- **Audio**: `getAudioContext()` returns null when `typeof window === "undefined"`.
- **Rendering**: Three.js only in client; canvas created in useEffect.

## Key files

| File | Purpose |
|------|---------|
| `components/SimulatorShell.tsx` | Main loop, state, HUD, overlays |
| `components/InputManager.tsx` | Keyboard listener, raw control state |
| `app/simulator/page.tsx` | Client wrapper for simulator |
| `modules/flight-model/simulate.ts` | Core physics step |
| `modules/world/config.ts` | Launch, wind, thermals, ridge |
