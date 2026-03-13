# AGENT.md

## Current implementation state

The simulator is a deployable prototype with:

- **Flight and controls**: First-person flight, wind/thermals/ridge lift, fixed timestep simulation, smooth input ramping, FPV/TPV/Top camera (Key C), persistent settings (localStorage), volume sliders, HUD ~25% larger for readability (altitude, VSI, LZ distance, flare hint, compass, wind), pause/restart/landing flow.
- **World**: Mountain level (valley, launch ridge, landing basin, west/east walls); terrain height/biome (grass, earth, rock, scree) with vertex-color blending; water (valley lake + optional side basins) and obstacles (tree clusters, rocks) with collision; clear zones for launch, landing, and route.
- **Rendering**: Sky gradient and fog from `atmosphere-config`; world-kit for foliage (slim/full tree variants), rocks (rounded/blocky variants), and water; gates (slate ring + posts, fog-aware), thermals (soft cylinder, fog-aware), windsock (base + pole + sock at LZ); terrain mesh and scene-decor use world-kit.
- **Quality**: E2E tests, unit/integration tests (flight model, terrain, obstacles, gates, world-kit, atmosphere), lint/typecheck/build. See `docs/ARCHITECTURE.md` and `docs/TEST_STRATEGY.md` for module and test coverage.

---

## 1. Project Mission

Build a professional-quality, browser-based, first-person paraglider flight simulator using Next.js and TypeScript, intended to run smoothly on the web and to be deployed on Vercel.

The simulator must feel realistic, responsive, visually professional, and technically well-structured. It should prioritize believable paraglider flight behavior over arcade gameplay, while still remaining playable for users with keyboard controls.

This project must be developed incrementally in clearly defined phases, with tests, documentation, and performance validation throughout the process.

---

## 2. Core Product Goal

Create a **realistic first-person paraglider flight simulator** that runs in the browser.

### High-level experience goals
- The user launches from a mountain slope or launch area.
- The user experiences believable gliding, turning, speed changes, sink behavior, and environmental lift.
- The game is played in **first-person view**.
- The game runs smoothly in modern desktop browsers.
- Controls are keyboard-first and intuitive.
- The prototype should already feel polished enough to resemble a professional game prototype.

### Mandatory camera mode
- First Person View (FPV) is the primary and default camera mode.
- Optional debug or third-person camera may exist for development purposes only, but must not replace FPV as the main mode.
- The player should feel like they are suspended under the wing, looking forward through the airspace and terrain.

---

## 3. Platform and Deployment

### Runtime platform
- Desktop web browser is the primary target.
- Mobile is not a priority for the prototype.
- The simulator should be optimized for keyboard play on desktop/laptop.

### Deployment target
- Vercel

### Required framework
- Next.js (latest stable version appropriate for production use)
- TypeScript strict mode enabled

### Rendering approach
- WebGL-based 3D rendering
- Use Three.js directly or React Three Fiber if justified
- Prefer the approach that gives the cleanest architecture, reliable performance, and best maintainability

---

## 4. Primary User Controls

The simulator uses the following keyboard controls as the default control scheme. **This section documents the current implementation** and must be kept in sync with the codebase.

### 4.1 Key Bindings (Current Implementation)

| Key | Action | Notes |
|-----|--------|-------|
| **Arrow Left** | Steer left | Smooth ramp up/down |
| **Arrow Right** | Steer right | Smooth ramp up/down |
| **Arrow Down** | Brake (pull both toggles) | Smooth ramp up/down; horizon tilts up when braking |
| **Arrow Up** | Accelerated flight (speed bar) | Smooth ramp up/down; horizon tilts down when accelerating |
| **A** | Look left | Max 90°; smooth ramp; returns to center when released |
| **D** | Look right | Max 90°; smooth ramp; returns to center when released |
| **W** | Look up | Smooth ramp; returns to center when released |
| **X** | Look down | Smooth ramp; returns to center when released |
| **S** | Look forward (reset view) | Smoothly returns head look to center |
| **P** | Pause / Resume | Toggles pause overlay |
| **C** | FPV / TPV / Top | Cycles camera: FPV → TPV → Top → FPV |

### 4.2 Input Smoothing

All inputs use smooth ramping for a realistic, controlled feel:

- **Flight controls (steer, brake, accel)**: Ramp up when key held, ramp down when released. Brake and accel return to 0% when keys are released.
- **Look controls (a, d, w, x)**: Same ramp style as steer. When released, head look smoothly returns to center. Key **S** also returns head look to center.
- **Steer**: Ramp up ~0.7/s, ramp down ~0.5/s.
- **Brake/Accel**: Ramp up/down ~0.8/s.
- **Head look**: Ramp up ~0.45/s, ramp down ~0.35/s (same as steer).

### 4.3 Visual Feedback from Controls

- **Steer left/right**: Bank angle and horizon tilt in turn direction. Coordinated turn physics (turn rate from bank).
- **Brake (Down)**: Horizon tilts up (nose down). Pitch attitude returns to neutral when released.
- **Accelerate (Up)**: Horizon tilts down (nose up). Pitch attitude returns to neutral when released.
- **Rapid brake/accel switching**: Produces a swing/pendulum effect due to pitch attitude inertia.

### 4.4 Control Interpretation

These controls should be modeled as pilot input to the wing, not as arcade vehicle controls.

### 4.5 Behavior Expectations

#### Arrow Left / Arrow Right
- Applies steering input with smooth ramp
- Causes the paraglider to bank and turn (coordinated turn: turn rate from bank angle)
- Turning feels gradual and aerodynamically plausible
- Bank decays toward level when steering is released

#### Arrow Down (Brake)
- Represents pulling both brake toggles
- Reduces forward speed
- Reduces descent rate
- Horizon tilts up (pitch attitude)
- Releasing returns brake to 0% and pitch to neutral

#### Arrow Up (Accelerate)
- Represents speed bar / accelerated flight
- Increases forward airspeed
- Increases descent rate
- Horizon tilts down (pitch attitude)
- Releasing returns accel to 0% and pitch to neutral

#### A / D / W / X (Head Look)
- Independent of flight direction; pilot looks around
- A = look left, D = look right (max ±90°)
- W = look up, X = look down
- S = look forward (reset)
- All use smooth ramp; view returns to center when key released

### 4.6 Input Design Rules

- Inputs must not snap unrealistically
- Use smoothed input curves (ramp up/down) for all controls
- Input abstraction layer exists in `modules/input`; controls can be remapped
- Keyboard is required first; gamepad support is optional for later phases

---

## 5. Simulation Philosophy

The project must simulate the experience of flying a paraglider in a believable way.

This does **not** require academic CFD-level realism, but it **does** require a carefully designed flight model that captures the important characteristics of paragliding.

### Realism priorities
1. Believable glide behavior
2. Believable turning behavior
3. Believable sink and speed relationships
4. Wind influence
5. Lift sources such as thermals and ridge lift
6. Correct consequences of brake and acceleration input
7. Convincing landing behavior

### Avoid
- Arcade airplane controls
- Instant roll snaps
- Unrealistic hovering
- Constant altitude flight without lift
- Video-game “boost” mechanics
- Car-like steering
- Overly floaty physics without sink realism

---

## 6. MVP Scope

The first playable professional prototype must include:

- One playable mountain or hillside map
- One paraglider setup
- First-person flight
- Launch / airborne flight / landing loop
- Keyboard controls
- Basic HUD
- Wind influence
- Thermals or ridge lift
- Ground collision / landing detection
- Scoring or session summary
- Playable frame rate on the web
- Clean code architecture
- Automated tests for core simulation logic

### Excluded from MVP unless trivial
- Multiplayer
- Career mode
- AI pilots
- Full world streaming
- Dynamic weather systems at large scale
- Multiple gliders
- Full character animation
- VR
- Photoreal open world

---

## 7. Non-Functional Quality Requirements

The project must be engineered like a professional studio prototype.

### Performance targets
- Smooth browser experience on modern desktop hardware
- Target 60 FPS under normal conditions
- Minimize stutter and frame pacing issues
- Use efficient update loops
- Avoid unnecessary React re-renders in the simulation/render loop

### Code quality
- TypeScript strict mode
- Avoid `any`
- Modular architecture
- Clear separation of simulation, rendering, input, UI, and world systems
- Strong naming and documentation
- No large monolithic files when avoidable

### Reliability
- Deterministic simulation mode for testing where possible
- Stable state transitions
- Minimal runtime errors
- No unresolved console spam

### Maintainability
- Config-driven aircraft tuning parameters
- Centralized constants where appropriate
- Small, composable systems
- Easy future path for adding more gliders, more maps, and richer weather

---

## 8. Visual and Experience Quality Bar

The simulator should look and feel like a serious prototype from a professional indie or AA game team.

### Visual goals
- Clear atmospheric depth (sky gradient, fog, lighting from atmosphere-config)
- Good terrain readability from the air (biome blending, valley, landmarks)
- World presentation via world-kit (materials + reusable foliage, rocks, water); gates, thermals, windsock integrated and readable
- Strong sensation of movement and altitude
- Good horizon and sky rendering
- Convincing forward speed cues
- Clean HUD
- Professional menu and settings styling

### FPV immersion goals
- Camera should feel attached to pilot perspective beneath the canopy
- Motion should communicate turns and speed without becoming nauseating
- Subtle head/camera movement is acceptable if done carefully
- Visual feedback should support situational awareness:
  - heading
  - altitude
  - terrain approach
  - air movement cues
  - landing approach

### Do not
- Overload the screen with debug visuals in production mode
- Use exaggerated shaky-cam
- Use noisy post-processing that harms clarity
- Let UI obstruct first-person visibility

---

## 9. Recommended Tech Stack

Use the most professional and practical choices for a web-based simulator in Next.js.

### Required
- Next.js
- TypeScript
- ESLint
- Prettier
- Unit/integration test framework
- E2E test framework

### Preferred stack
- Next.js App Router
- Three.js for rendering
- Zustand or an equivalent lightweight state solution where appropriate
- Vitest for unit and integration tests
- Playwright for end-to-end tests

### Libraries
New dependencies may be added only when they clearly improve implementation quality, performance, or maintainability.

Do not add dependencies casually.

---

## 10. Architecture Principles

The project architecture must separate concerns cleanly.

### Mandatory separation
- **Simulation layer**: flight dynamics, wind, lift, aircraft state, collisions, scoring logic
- **Rendering layer**: scene graph, camera, terrain visuals, sky, materials, effects
- **Input layer**: keyboard state, smoothing, mapping to control intentions
- **UI layer**: HUD, menus, settings, overlays
- **World layer**: terrain, lift zones, spawn points, landing zones
- **Audio layer**: wind, variometer, landing sound; shared context
- **Settings layer**: `modules/settings` – audio toggles, debug mode
- **Testing layer**: deterministic simulation tests and gameplay verification

### Hard rules
- Rendering code must not contain business logic
- UI should not directly own simulation math
- Simulation must not depend on React rendering lifecycle
- Flight model must be testable without a browser renderer
- Keep aerodynamic tuning data externalized in config objects where possible

---

## 11. Simulation Loop Rules

The simulator must use a robust update architecture.

### Mandatory loop behavior
- Use a fixed timestep simulation loop for core physics
- Rendering may run at display frame rate
- Decouple simulation updates from rendering where possible
- Interpolate visual state if useful

### Reasons
This improves consistency, testability, and flight-feel stability across machines.

### Requirements
- Flight simulation should not be purely frame-dependent
- Input should be sampled consistently
- Random turbulence/lift behavior should support seeded deterministic mode in tests

---

## 12. Flight Model Requirements

The flight model must model the essential behavior of a paraglider.

This can be simplified, but not arcade-like.

### Minimum flight state variables
- Position (3D)
- Velocity (3D)
- Forward speed / airspeed proxy
- Vertical speed
- Heading / yaw
- Turn rate
- Brake input
- Speed bar / acceleration input
- Wind influence
- Grounded / launched / airborne / landed state

### Core aerodynamic behavior to approximate
- Gravity
- Lift
- Drag
- Sink rate
- Glide ratio
- Speed-to-sink relationship
- Turn-induced performance loss
- Brake-induced speed reduction and altered sink characteristics
- Accelerated flight increases speed and sink
- Wind-relative movement
- Environmental lift contribution

### Required flight feel characteristics
- The glider should naturally descend in still air
- It should travel forward while descending
- Turning should incur aerodynamic cost
- Strong braking should meaningfully alter behavior
- Speed-up input should increase speed and worsen descent appropriately
- Lift sources must be able to offset sink and allow climbing

### Realism guidance
Use a **believable simplified paraglider model**, not a generic airplane model.

---

## 13. Environmental Systems

The world must affect flight.

### Required environmental systems for prototype
- Global wind vector
- At least one lift mechanic:
  - thermals, and/or
  - ridge lift

### Wind requirements
- Wind must affect ground track
- Wind must influence approach and movement relative to terrain
- Wind strength and direction should be tunable
- Strong wind should alter handling experience

### Thermal requirements (implemented)
- Spatial cylindrical zones with radial falloff
- Soft edge (1.0–1.15× radius) for learnable, forgiving approach
- Deterministic; no randomness
- Visual cylinders in scene for discoverability

### Ridge lift (implemented)
- Line-based zones; lift when wind crosses ridge perpendicularly
- Wind-dependent: no wind = no ridge lift
- Default ridge: north-south at x = 85 (downwind of launch), width 50 m
- Visual ridge wall in scene

---

## 14. Launch, Flight, and Landing States

The simulator must implement the basic lifecycle of a paraglider session.

### Required states
- Ready / spawn
- Launch
- Airborne
- Landed
- Reset / restart

### Launch requirements
- Player begins at a launch area
- Launch should transition cleanly into flight
- MVP may simplify inflation and running mechanics, but the transition must feel intentional and polished

### Airborne requirements
- Stable sim loop
- Ongoing response to controls and environment
- HUD updates in real time

### Landing requirements (implemented)
- Detect contact with terrain (altitude + speed thresholds)
- Landing quality: smooth (<1 m/s sink), hard (1–2.5 m/s), rough (>2.5 m/s)
- Flare zone hint "↓ FLARE" in HUD when altitude < 4 m
- Post-flight summary with airtime, max altitude, distance, landing quality, wind, landing type, base score, windsock proximity, final score
- Restart button; audio stops on pause and landing
- Ground contact is basic physics: when the wing or pilot touches terrain, `worldY` must be clamped to terrain height and `ALT` must be exactly `0`

---

## 15. Camera Requirements

First-person view is the primary and default camera mode.

### Camera modes (Key C cycles)
- **FPV** (first-person): Pilot eye view, primary experience. Paraglider not visible.
- **TPV** (third-person): Camera behind and above glider. Paraglider visible.
- **Top**: Top-down view from above the aircraft (~120 m), looking straight down at ground, thermals, and objects. Paraglider visible. Steering (Arrow Left/Right) works in all modes.

### Primary camera requirements
- Camera should be placed to simulate pilot eye position in FPV
- Camera must look forward along the flight path/harness orientation
- Camera movement should communicate banking/turning subtly
- Camera should preserve readability of the horizon and landing zone

### Acceptable enhancements
- Slight procedural movement for immersion
- Slight pitch/roll cues
- Speed sensation cues through motion and sound

### Avoid
- Excessive bobbing
- Excessive FOV distortion
- Motion sickness inducing camera lag
- Cinematic third-person emphasis in normal play

### Debug-only optional camera
- A third-person debug camera is allowed only for development and tuning
- It must be hidden or disabled in production mode unless explicitly enabled

---

## 16. HUD and UI Requirements

The prototype needs a clean, professional HUD.

### Required HUD elements
- Airspeed or speed proxy
- Altitude
- Vertical speed / climb-sink indication
- Heading indicator or compass
- Wind indicator or simple wind readout
- Session state (flying / landed / paused)
- Optional FPS in debug mode

### Implemented
- HUD sized ~25% larger than baseline for better readability (font sizes, padding, panel position).
- Variometer-style readout (VSI, lift indicator)
- Minimalist flight instrument layout
- Pause overlay (P key or button): Hervat, Opnieuw, Instellingen
- Settings panel: vario, wind, landing, debug HUD toggles
- Restart button after landing
- Controls legend bottom-left

### UI quality rules
- Keep the HUD readable and lightweight
- Do not obstruct the first-person experience
- Use a clean visual hierarchy
- Distinguish debug overlays from player-facing HUD

---

## 17. Audio Requirements

Audio supports flight feel and situational awareness.

### Implemented audio systems
- **Wind**: Continuous filtered noise, gain scales with airspeed (2–12 m/s)
- **Variometer**: Beep on climb (>0.2 m/s); pitch and rate scale with climb; silent on sink
- **Landing**: One-shot low tone on touchdown; volume/duration scale with landing quality

### Rules
- Audio stops when paused or landed
- All audio systems toggleable in settings (vario, wind, landing)
- Shared AudioContext; resume after user gesture (browser policy)

---

## 18. Terrain and World Requirements

The simulator needs terrain suitable for paraglider gameplay.

### Prototype world requirements (implemented)
- **Terrain shape**: Mountain level with valley carve, landing basin, valley apron; launch ridge and west/east walls; second mountain; biome sampling (grass, earth, rock, scree) and vertex-color blending; procedural detail texture.
- **Landing zone**: 70 m radius at level-defined (x, z); LZ circle mesh and windsock; `isInLandingZone(x,z)` / `isInLandingClearZone` helpers.
- **Launch**: Clear area and platform at level launch position; terrain height used for spawn.
- **Water**: Valley lake (centreline) and optional side basins; placement only where basin factor and slope allow; world-kit `createWaterSurface`; no collision.
- **Obstacles**: Trees (clusters, world-kit slim/full variants), rocks (ridge/sidewall, world-kit rounded/blocky variants); both have collision. Clear zones: launch, landing, route corridor. `modules/world/obstacles` and `modules/rendering/world-kit`.
- **Gates**: Vertical ring + posts above terrain; slate materials, Lambert, fog-aware; gate progress logic unchanged.
- **Thermals / ridge**: Thermal visuals (soft cylinder, fog-aware); ridge visuals grounded on terrain.
- **Rendering pipeline**: `atmosphere-config` for sky gradient, fog, hemisphere, sun, fill; FPV scene uses it. World decor from `scene-decor` using world-kit only. Good aerial and route readability from FPV.

### Terrain rules
- Terrain is stylized-realistic alpine; see `docs/ART_DIRECTION.md`.
- Terrain must support wind/lift gameplay.
- Avoid making terrain so detailed that performance degrades too early.
- Terrain collision must be reliable.
- `ALT` is never absolute world height. It always means `worldY - terrainHeightAt(x, z)`.
- Terrain collision, landing state, flare logic, HUD altitude, pause/debug snapshots, and scoring must all use the same shared terrain sampling source.
- The rendered terrain mesh must use the same world coordinate orientation and height source as physics terrain. A mirrored or remapped visual terrain is a bug.
- On terrain contact, `ALT = 0` exactly. The paraglider must never go below the terrain surface.

---

## 19. Game Design Requirements

This is a simulator-first experience, but it still needs game structure.

### Prototype gameplay loop
- Spawn at launch
- Start flight
- Explore and maintain altitude where possible
- Navigate through air
- Attempt landing
- Receive summary/score
- Restart

### Scoring (implemented)
- **Landing type base score**: Downwind 25 pt, into-wind no flare 50 pt, into-wind with flare 100 pt. Crash = 0.
- **Windsock proximity**: Up to 100 pt for landing close to the windsock (LZ center). 100 pt at 0 m; −1% per 2 m distance; 0 pt at 200 m. Formula: `windsockProximityPoints = round(100 * max(0, 1 - distance/200))`.
- **Final score**: `baseScore + windsockProximityPoints` (max 200 pt for perfect into-wind flare on the windsock).
- Post-flight overlay shows wind, landing type, basispunten, afstand windsock, windzak pt, eindscore, vluchttijd, hoogte, afstand.

### Avoid
- Arcade collectibles as primary loop
- Unrealistic gamification that harms simulation identity

---

## 20. Performance Engineering Requirements

Because this is a web-based simulator, performance is a first-class requirement.

### Mandatory performance rules
- Profile performance during development
- Keep render loop efficient
- Avoid unnecessary object allocations inside hot loops
- Minimize React state churn during simulation
- Use memoization and imperative rendering patterns where appropriate
- Prefer stable data structures for per-frame systems

### Browser performance goals
- Fast initial load for prototype standards
- Stable frame pacing during flight
- Avoid long main-thread stalls

### Optimization priorities
1. Simulation loop correctness
2. Render loop efficiency
3. Terrain/render complexity balance
4. Reduced React overhead in hot paths

---

## 21. Accessibility and UX Rules

Even as a simulator, the experience should be understandable.

### Implemented
- Controls legend (bottom-left)
- Pause overlay: Hervat, Opnieuw, Instellingen
- Restart flow (from pause and after landing)
- Settings panel: vario, wind, landing, debug HUD toggles; volume sliders
- Settings accessible via ⚙ button, pause overlay, or landed overlay
- Settings persistence (localStorage); fallback to defaults if unavailable

---

## 22. Testing Strategy

Tests are mandatory.

### Required test categories
1. Unit tests
2. Integration tests
3. End-to-end tests

### Unit tests must cover at minimum
- Flight model calculations
- Speed vs sink behavior
- Brake input effects
- Accelerated flight effects
- Turn behavior calculations
- Wind vector influence
- Lift zone effects
- Landing / scoring math

### Integration tests must cover at minimum
- Simulation state transitions
- Launch to airborne flow
- Airborne to landing flow
- Input mapping behavior
- Settings/state interactions if implemented

### E2E tests must cover at minimum
- App loads
- Simulator route renders
- Flight session can start
- No obvious crash on a short play session
- HUD appears and updates

### Test quality rules
- Prefer deterministic tests
- Seed randomness in tests
- Avoid flaky timing assumptions
- Keep simulation math testable independently of rendering

---

## 23. Linting, Type Safety, and CI Discipline

All code changes must maintain a professional engineering baseline.

### Required commands
The project must have scripts for:
- lint
- typecheck
- test
- test:e2e
- build

### Hard requirements
- Do not leave TypeScript errors unresolved
- Do not ignore lint errors casually
- Do not merge broken tests
- Add tests when changing simulation-critical behavior

---

## 24. Baseline and Tuning Workflow

When improving flight behavior or tuning, work explicitly from the current implementation. Treat the simulator and this AGENT.md as the baseline.

### Rules
- Do not revert previously desired behaviors
- Replace existing tuning only when there is a clear reason
- Preserve improvements that already work well
- Make only targeted improvements on remaining weak points
- Avoid broad rewrites or retuning everything at once

### Before making substantial changes
1. **Summarize** which flight behavior has already been consciously adjusted (see below)
2. **Name** which parts you will leave untouched
3. **Identify** only the 2–4 biggest remaining weak points
4. **Improve** only those points

### Current flight behavior (consciously tuned)
- **Speed/polar**: Brake reduces speed (factor 0.45 at full brake), accel increases (1.45×). Trim 8 m/s, min 2 m/s.
- **Sink polar**: Trim 1.25 m/s, full brake 0.65 m/s, full accel 2.6 m/s. Turn-induced sink (bank factor 0.22).
- **Bank/turn**: Max bank 35°, coordinated turn (ω = g·tan(bank)/v). Bank rate up 0.95/s, down 1.4/s.
- **Pitch attitude**: Brake = horizon up, accel = horizon down. Max ±10°, rates 1.1/1.5.
- **Flare**: Below 4 m, brake ≥ 0.4 reduces sink (flare effect). Flare sink reduction 0.5 m/s. HUD shows "↓ FLARE" when in zone.
- **Near-stall**: Brake > 0.92 adds sink penalty (0.4 m/s) for over-braking.
- **Thermal response**: Vertical speed blend rate 80 for direct lift response.
- **Input smoothing**: Steer 0.7/0.5, brake/accel 0.8, head look 0.45/0.35.

### Leave untouched unless justified
- Core polar and sink relationships
- Coordinated turn physics
- Flare and near-stall logic
- Input ramp rates that feel good
- Camera modes (FPV, TPV, Top) and C-key cycle

---

## 25. File and Module Organization

Use a clean and scalable structure.

A recommended structure:

```txt
/app
/components
/modules
  /flight-model
  /rendering
    atmosphere-config   # sky, fog, lighting
    world-kit/          # materials, foliage, rocks, water (asset-driven pipeline)
    fpv-scene, terrain-mesh, gate-mesh, windsock-mesh, scene-decor
  /world
    terrain, level-loader, obstacles, gates, windsock, types
  /input
  /hud
  /audio
  /game-session
  /scoring
  /settings
/lib
/public
/tests
  /unit
  /integration
  /e2e
/docs