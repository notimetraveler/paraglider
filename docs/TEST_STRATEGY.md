# Test Strategy

## Unit tests (`tests/unit/`)

| File | Coverage |
|------|----------|
| `flight-model.test.ts` | simulateStep, sink, turn, brake, accel, flare, landing |
| `environment.test.ts` | Wind drift, thermal lift, ridge lift, determinism |
| `game-session.test.ts` | deriveFlightState, didJustLand, classifyLandingQuality |
| `scoring.test.ts` | Score computation, formatting |
| `hud.test.ts` | mapAircraftToHudData, format helpers, distanceToLz |
| `input.test.ts` | Keyboard mapping, control state |
| `audio.test.ts` | Vario, wind, landing params |
| `settings.test.ts` | DEFAULT_SETTINGS, persistence, mergeWithDefaults |
| `world.test.ts` | Landing zone, world layout |

## Integration tests (`tests/integration/`)

| File | Coverage |
|------|----------|
| `launch-land-restart.test.ts` | createLaunchState, full flight cycle, restart |

## E2E tests (`e2e/`)

| Scenario | Coverage |
|----------|----------|
| App loads | Home page, title |
| Simulator route | HUD visible, SPD/ALT |
| Home → simulator | Navigation |
| Settings panel | Open, close, toggles |
| Volume persistence | Slider change, refresh, value persists |
| Pause | Overlay, Hervat |
| Restart | From pause overlay |
| Settings in pause | Settings panel in overlay |
| Landing flow | ArrowUp → landed overlay, summary |
| Full session smoke | Home → simulator → settings → pause → restart |

## Running tests

```bash
npm run test        # Unit + integration
npm run test:e2e    # Playwright (requires dev server or port 3000)
```

## Test quality rules

- Prefer deterministic tests
- No flaky timing assumptions
- Simulation math testable without DOM
