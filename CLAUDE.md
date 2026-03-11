# CLAUDE.md

## Mission

Build and refine a professional-quality, browser-based, first-person paraglider flight simulator using Next.js and TypeScript, optimized for smooth deployment on Vercel.

The product goal is a realistic and believable paraglider flying experience in the browser, not an arcade flying game.

This file defines persistent project guidance for Claude Code. Follow it across sessions unless a more specific architecture or design document overrides a particular detail.

---

## Product Identity

This project is:

- a first-person paraglider flight simulator
- browser-based
- desktop-first
- realism-oriented
- performance-sensitive
- intended to feel like a professional prototype moving toward a polished final product

This project is not:

- a generic airplane game
- an arcade boost-based flying game
- a third-person cinematic flight toy
- a feature-explosion sandbox with weak fundamentals

---

## Primary Experience Goals

The simulator should deliver:

- believable gliding and descent
- believable turning behavior
- realistic relationship between speed, sink, brake input, and accelerated flight
- useful environmental lift
- convincing first-person flight sensation
- stable, smooth performance in the browser
- professional engineering discipline

The user should feel suspended beneath a paraglider wing in a navigable airspace, reading terrain, altitude, wind, and lift.

---

## Camera and Controls

### Camera
- First-person view (FPV) is the primary and default experience.
- **Key C** cycles camera modes: FPV → TPV → Top → FPV.
- **FPV**: Pilot eye view, paraglider not visible.
- **TPV**: Third-person, camera behind and above glider, paraglider visible.
- **Top**: Top-down view from above (~120 m), looking straight down at ground, thermals, and objects. Paraglider visible. Steering (Arrow Left/Right) works in all modes.
- Do not let debug cameras become the main gameplay camera.

### Keyboard controls (current implementation)

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

### Input smoothing
All inputs use smooth ramping for a realistic, controlled feel:

- **Flight controls (steer, brake, accel)**: Ramp up when key held, ramp down when released. Brake and accel return to 0% when keys are released.
- **Look controls (a, d, w, x)**: Same ramp style as steer. When released, head look smoothly returns to center. Key **S** also returns head look to center.
- **Steer**: Ramp up ~0.7/s, ramp down ~0.5/s.
- **Brake/Accel**: Ramp up/down ~0.8/s.
- **Head look**: Ramp up ~0.45/s, ramp down ~0.35/s (same as steer).

### Visual feedback from controls
- **Steer left/right**: Bank angle and horizon tilt in turn direction. Coordinated turn physics (turn rate from bank).
- **Brake (Down)**: Horizon tilts up (nose down). Pitch attitude returns to neutral when released.
- **Accelerate (Up)**: Horizon tilts down (nose up). Pitch attitude returns to neutral when released.
- **Rapid brake/accel switching**: Produces a swing/pendulum effect due to pitch attitude inertia.

### Control philosophy
Treat inputs as pilot control inputs, not arcade steering commands.

- turning should feel progressive
- brake should alter airspeed and sink behavior plausibly
- accelerated flight should increase speed and worsen descent appropriately
- avoid instant, gamey response curves unless explicitly needed for accessibility

---

## Technical Architecture

### Core architectural separation
Maintain strict separation between:

- simulation
- rendering
- input
- UI/HUD
- world/environment
- audio
- session/scoring logic

### Hard rules
- rendering code must not contain business logic
- simulation code must not depend on React rendering lifecycle
- UI must not own physics logic
- flight model code must be testable outside the renderer
- aerodynamic tuning values must be centralized, not scattered as magic numbers

### Preferred structure
- `app/` for Next.js routes and app shell
- `components/` for UI components
- `modules/flight-model/`
- `modules/rendering/`
- `modules/world/`
- `modules/input/`
- `modules/hud/`
- `modules/audio/`
- `modules/game-session/`
- `modules/scoring/`
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`

---

## Simulation Rules

### Simulation philosophy
Implement a believable simplified paraglider model.

Do not substitute:
- airplane logic
- scripted fake motion
- purely visual gliding without real underlying state updates

### Flight characteristics to preserve
- forward glide while descending in still air
- meaningful sink rate
- turn-induced performance cost
- brake effects on speed and descent
- accelerated flight increases speed and sink
- lift sources can offset sink and permit climb
- wind affects ground track and approach

### Required simulation loop behavior
- use fixed timestep simulation for core flight updates
- keep rendering decoupled where possible
- prefer deterministic test mode
- support seeded randomness for turbulence/lift behavior in tests

---

## Environmental Systems

The world must affect flight.

Prioritize:
- global wind vector
- thermals and/or ridge lift
- terrain interaction
- launch area and landing zone

Environmental systems should be:
- tunable
- understandable
- testable
- performance-aware

Avoid overcomplicated weather systems before the fundamentals are solid.

---

## Performance Expectations

This is a web simulator. Performance is a product feature.

### Targets
- smooth desktop browser play
- target 60 FPS in normal flight conditions
- stable frame pacing
- low React overhead in hot paths

### Rules
- avoid unnecessary allocations in per-frame code
- avoid unnecessary React re-renders
- profile before and after major rendering or simulation changes
- optimize terrain/render complexity when needed
- prefer robust architecture over clever but fragile performance hacks

---

## Visual Quality Direction

Aim for a professional prototype aesthetic.

Prioritize:
- terrain readability from the air
- a clear horizon and sky
- atmospheric depth
- strong sensation of movement and altitude
- restrained but useful HUD
- a clean settings/pause flow

Avoid:
- cluttered UI
- excessive screen shake
- noisy post effects
- visuals that reduce readability in first-person flight

---

## Audio Direction

Audio should support flight feel and situational awareness.

Prioritize when available:
- wind audio tied to speed
- variometer cues
- landing/touchdown feedback
- lightweight UI sounds

Audio must remain optional and adjustable in settings.

---

## Coding Standards

### Language and quality
- TypeScript strict mode
- avoid `any`
- avoid oversized files
- favor explicit names and clear module boundaries
- prefer readable code over clever code

### Dependencies
Do not add dependencies casually.

Only add a new dependency if it clearly improves:
- maintainability
- correctness
- performance
- developer productivity

When adding a dependency:
- justify it
- keep usage isolated and understandable

### Configuration
Centralize tunable values:
- glide characteristics
- sink characteristics
- brake sensitivity
- turn response
- accelerated flight response
- wind strength
- thermal strength
- ridge lift behavior
- landing thresholds

---

## Testing Standards

Testing is mandatory for simulation-critical code.

### Required coverage focus
- flight model behavior
- speed vs sink relationships
- brake input effects
- accelerated flight effects
- turn behavior
- wind influence
- lift zone interaction
- landing/scoring calculations
- session state transitions

### Test categories
- unit tests for simulation math and pure logic
- integration tests for gameplay state transitions
- e2e tests for app boot and simulator availability

### Rules
- prefer deterministic tests
- seed randomness where needed
- do not ship untested simulation behavior changes
- keep tests aligned with real product behavior, not implementation trivia

---

## Workflow Expectations for Claude Code

When working on this repository:

1. read relevant project docs first
2. identify the current subsystem and goal
3. make a brief implementation plan
4. change only the files needed
5. add or update tests
6. run validation commands
7. summarize what changed and what remains

### Baseline and tuning discipline
- Treat the current simulator and AGENT.md as the baseline. Do not revert desired behaviors.
- Replace tuning only when there is a clear reason. Preserve what works.
- Before changing flight behavior: (1) summarize what is already tuned, (2) name what stays untouched, (3) identify only 2–4 weak points, (4) improve only those.
- Avoid broad rewrites or retuning everything at once.

### Validation discipline
Regularly run:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

Do not claim completion if relevant validation is failing.

---

## What to Avoid

Do not:

- rewrite major subsystems without strong justification
- mix physics with rendering/UI logic
- introduce magic constants across the codebase
- overbuild advanced systems before the prototype loop is solid
- prioritize flashy effects over flight feel
- ship broken tests
- let debug tools leak into the main player experience without intent

---

## Debugging and Developer Tooling

Useful debug features are encouraged if isolated cleanly.

Allowed debug tools:
- debug HUD
- simulation state readouts
- wind vector display
- lift zone visualization
- velocity / vertical speed display
- optional third-person debug camera

Keep debug tools behind explicit flags or debug mode.

---

## Deployment Direction

The simulator must remain compatible with Next.js deployment on Vercel.

### Rules
- keep browser-only code properly isolated
- avoid server/client boundary mistakes
- verify production build behavior
- ensure simulator route works in production mode
- keep assets practical for web delivery

---

## Long-Term Direction

The long-term goal is a polished, highly believable web paraglider simulator.

Short-term development should always strengthen that path by improving:

- realism
- architecture
- testability
- browser performance
- production readiness
- polish

When trade-offs are necessary, prefer the option that best supports a maintainable, realistic, high-quality simulator over the life of the project.