# Mountain Level & Gameplay Expansion — Design

> Step 17: World- en gameplay-expansion phase voor de paraglider simulator.

## 1. Huidige world en gameplay — samenvatting

### World
- **Terrain**: Vlakke grond (PlaneGeometry 2000×2000 m), groene 50 m grid texture, GROUND_LEVEL = 0.
- **Launch**: Spawn op (0, 80, 0), heading 0, initialSpeed 8 m/s. Launch platform = cilinder (15–18 m radius).
- **Landing zone**: Cirkel 70 m radius, gecentreerd op launch (zelfde positie). Lichtere groene patch.
- **Thermals**: 3 cilindrische zones (physics + visueel), soft edge 1.15× radius. Starter thermal nabij launch, andere downwind.
- **Ridge lift**: Lijn x=85, noord–zuid, width 50 m. Wind uit west (x=-5) kruist loodrecht.
- **Decor**: Kleurrijke pilaren op 200 m grid (rood/groen/blauw/geel/cyaan/magenta) — oriëntatie.

### Gameplay
- **Loop**: Spawn → vlieg → land → score (airtime, max altitude, distance, landing quality).
- **Geen route/challenge**: Speler vliegt vrij; thermiek en ridge zijn “ontdekbaar” maar niet gestructureerd als doel.
- **Geen gates/checkpoints**: Geen slalom of route-elementen.
- **Wind**: Alleen visueel in HUD; geen windzak of duidelijke windrichting in de wereld.

### Architectuur
- `modules/world`: config.ts (LAUNCH_CONFIG, DEFAULT_THERMALS, DEFAULT_RIDGE, isInLandingZone), lift.ts, types.ts.
- `modules/rendering/fpv-scene.ts`: Hardcoded scene (ground, landing zone, launch platform, thermals, ridge, pilaren).
- SimulatorShell: gebruikt DEFAULT_ENVIRONMENT, LAUNCH_CONFIG, geen level-abstractie.

---

## 2. Drie grootste beperkingen

1. **Geen geloofwaardige omgeving**  
   Vlakke groene vlakte, kleurrijke pilaren, geen hoogteverschillen, geen bergen/water/bomen. Voelt als testgrid, niet als paraglider-locatie.

2. **Geen gestructureerde gameplay**  
   Geen route, gates of checkpoints. Thermiek is aanwezig maar niet bewust als gameplay-mechanic om een route te halen. Speler heeft geen duidelijk doel naast “vlieg en land”.

3. **Geen level-abstractie**  
   Alles hardcoded in config en fpv-scene. Geen data-driven structuur voor launch, landing, wind, thermals, gates. Uitbreiden naar meerdere levels of moeilijkheidsgraden vereist code-aanpassingen.

---

## 3. Plan: eerste “playable scenic mountain level”

### Doel
Eén mooie, speelbare bergmap met:
- Bergachtige omgeving (hoogteverschillen, bergtoppen, grasland, water, bomen)
- Duidelijke launch site op berg/helling
- Duidelijke landing zone met windzak
- Gates/checkpoints als route-challenge
- Thermiek als bewust gameplay-element om gates te halen

### Architectuur

**Level data (data-driven)**
- `modules/world/level-types.ts`: `LevelData` met launch, landing, wind, thermals, ridge, gates, difficulty.
- `modules/world/levels/mountain-01.ts`: Eerste berglevel als JSON-achtige structuur.
- `modules/world/level-loader.ts`: Parse/validate level data; export `getLevel(id)`.

**World foundation**
- `modules/world/terrain.ts`: `getGroundHeight(x,z)` — heightmap of simpele bergprofiel. Terrain collision gebruikt dit.
- `modules/rendering/terrain-mesh.ts`: Mesh van terrain (hoogteverschillen, texturen).
- Launch site: op berghelling, visueel herkenbaar.
- Landing zone: apart van launch, duidelijke LZ met windzak.

**Windzak**
- `modules/world/windsock.ts`: `getWindsockDirection(wind)` → heading voor visuele orientatie.
- Rendering: eenvoudige windzak-mesh bij landing zone, roteert met wind.

**Gates/checkpoints**
- `modules/world/gates.ts`: `Gate` type (positie, radius, volgorde). `checkGateProgress(position, gates)` → next gate index, passed gates.
- HUD: toon gate progress (bijv. “Gate 2/5”).

**Thermiek als gameplay**
- Thermals in level data geplaatst langs route tussen gates.
- Speler moet thermiek gebruiken om hoogte te behouden en volgende gate te halen.
- Eerste thermal nabij launch; volgende thermals strategisch tussen gates.

### Eerste bergmap — layout (conceptueel)

- **Launch**: Bergtop/helling ~(0, 0), hoogte ~120 m. Wind uit west.
- **Landing zone**: Vallei ~(150, 200), radius 70 m. Windzak bij LZ.
- **Gates**: 4–5 gates in slalom: launch → gate1 (thermaal) → gate2 → gate3 → gate4 → LZ.
- **Thermals**: 3–4 zones langs route; gate1 nabij thermal.
- **Terrain**: Heuvels, berg, vallei, meer of beek, grasland, boomgroepen (stylized).

### Moeilijkheidsfoundation
- `LevelData.difficulty`: `"easy" | "medium" | "hard"`.
- Later: variabele wind, kleinere gates, meer sink. Nu alleen veld in data.

---

## 4. Implementatie-scope (foundation + eerste speelbare versie)

1. **Level data structuur** — types, mountain-01 level, loader, tests.
2. **Terrain** — heightmap-achtige `getGroundHeight`, collision in simulate, terrain mesh in scene.
3. **Launch & landing** — launch op berg, LZ in vallei, windzak bij LZ.
4. **Gates** — gate types, check logic, HUD progress.
5. **Decor** — bergen, gras, water, bomen (eenvoudig, stylized).
6. **Integratie** — SimulatorShell gebruikt level; flight model gebruikt terrain height.

### Wat blijft behouden
- Flight model basis (geen wijziging aan polar, sink, turn, flare).
- Landing behavior (smooth/hard/rough).
- Audio (vario, wind, landing).
- Settings, HUD layout, camera modes.
- Tests voor flight model, game-session, scoring.
