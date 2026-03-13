# Art Direction — Paraglider Simulator

**Source of truth** for environment art and visual consistency. All terrain, foliage, landmarks, and rendering choices must align with this document.

Target: **stylized-realistic alpine world** — believable mountain landscape, browser-friendly, first-person readable.

---

## 1. Visual Style

### Core aesthetic
- **Stylized-realistic alpine**: Not photorealistic, not cartoon. Clean shapes, readable forms, believable proportions.
- **Credible mountain environment**: Peak, ridges, valleys, slopes — recognizable alpine geography.
- **Green valleys**: Grass, meadows, forest edges in lowland.
- **Rocky slopes**: Exposed rock on steep faces, ridges, high elevation.
- **Pine/conifer forests**: Tree clusters in valleys, not scattered everywhere.
- **Water bodies**: Lakes, streams that fit the terrain (depressions, valley floors).
- **Clear sky, atmospheric depth**: Good FPV readability; fog/haze for distance, not muddiness.

### Mood
- Morning alpine light — warm sun, cool shadows, crisp air.
- Calm, navigable — pilot can read terrain from the air.

---

## 2. Terrain Rules

### Material placement by height and slope

| Zone | Height (m) | Slope | Material | Use case |
|------|------------|-------|----------|----------|
| **Grass** | &lt; 55 | &lt; 0.18 | Green grass | Valley floor, meadows, gentle slopes |
| **Earth** | 55–75 or slope 0.18–0.30 | Moderate | Brown earth | Mid-slope, transition, forest floor |
| **Rock** | Any | &gt; 0.32 | Grey rock | Steep slopes, ridges, cliffs |
| **Scree** | &gt; 85 | &gt; 0.22 | Grey-brown scree | High exposed zones, summit approaches |

### Blending rules
- **Height**: Grass → earth above ~55 m; earth → scree above ~85 m on steep terrain.
- **Slope**: Steep slopes (&gt; 0.32) always show rock regardless of height.
- **Transitions**: Smooth blending between materials; no hard edges.
- **Valley floor**: Always grass unless very steep (rare in valleys).

### Terrain shape
- Peak near origin; valley toward positive x/z.
- Ridge lines, secondary peaks for visual interest.
- Subtle noise for natural variation, not flat planes.

---

## 3. Foliage Rules

### Tree placement
- **Where**: Grass biome only; slope &lt; 0.20.
- **Where not**: Rock, scree, steep earth; launch area; landing zone; water.
- **Clustering**: Trees in clusters, not evenly scattered.
- **Scale variation**: 0.7–1.2× base scale within clusters.
- **Biome rules**: Dense clusters in valley; sparse near forest edges; none on exposed slopes.

### Sight lines
- Keep approach corridors to gates and LZ relatively clear.
- No tree walls blocking key flight paths.
- Forest edges readable from the air as landmarks.

### Tree style
- Conifer/pine silhouette — cone + trunk.
- Stylized, not detailed; consistent with terrain.

---

## 4. Landmark Rules

### Natural landmarks for navigation
- **Water**: Lakes, ponds — dark blue, clear shoreline; logical in depressions.
- **Rock formations**: Distinct outcrops on ridges or slopes; grey, readable from distance.
- **Ridge lines**: Clear elevation change; rock/earth contrast.
- **Forest edges**: Clear boundary between meadow and forest.
- **Valley floor**: Flatter, greener; contrasts with slopes.

### Placement
- Landmarks support wayfinding, not decoration.
- Each landmark has a purpose: “fly toward the lake”, “ridge on the left”.

---

## 5. Gameplay Readability Rules

### Gates
- Readable but not arcade: soft ring, integrated color (e.g. sky-blue tint).
- Visible from approach; no harsh outlines or neon.
- Opacity ~0.6–0.7; fog-aware.

### Thermals
- Visible but not debug cylinders: soft, atmospheric volume.
- Warm tint (amber/orange); low opacity; no hard edges.
- Conveys “lift zone” without breaking immersion.

### Landing zone
- Clearly marked but integrated: slightly different grass tint, subtle circle.
- No bright runway stripes; natural meadow feel.
- Windsock functional and visually logical at LZ.

### Windsock
- Indicates wind direction; readable from approach.
- Matches world scale and style.

---

## 6. Rendering Rules

### Lighting
- Hemisphere: sky blue + ground green tint; ~0.55 intensity.
- Sun: warm white (e.g. 0xfff5e6); directional; ~0.75 intensity.
- Fill: cool blue; soft shadows; no harsh contrast.

### Fog / haze
- Linear fog: near ~600 m, far ~2400 m.
- Color matches sky (e.g. 0x8fc4e0).
- Adds depth; does not obscure nearby terrain.

### Color palette
- **Grass**: 0x3d6b2f – 0x4a7c3a (dark to light).
- **Earth**: 0x6b5344 – 0x7d6354.
- **Rock**: 0x5c5c5c – 0x787878.
- **Scree**: 0x6b6b5c – 0x8a8a78.
- **Water**: 0x2a5a7a (deep); 0x4a6b3a (shore).
- **Sky**: 0x7eb3d4.

### Performance budget
- Target 60 FPS on desktop.
- Terrain: single mesh, vertex colors + small detail texture.
- Trees: instancing or low-poly; &lt; 50 instances.
- No heavy post-processing; no SSR/SSAO in prototype.

---

## Implementation Plan (Next Visual Steps)

After this document, the following steps apply in order:

1. **Terrain materials & blending** (Stap 20): Implement height/slope-based material blending; improve biome thresholds; add smooth transitions.
2. **Terrain shape refinement**: Adjust heightmap for clearer valleys, ridges, and readable relief from FPV.
3. **Foliage density & placement**: Tune tree clusters per ART_DIRECTION; ensure sight lines; add scale variation.

Each step: small, controlled changes; run lint, typecheck, test, build before considering complete.
