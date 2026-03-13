# LEVEL_01_WORLD_SPEC.md

## Goal

Create a visually convincing, gameplay-ready alpine fjord valley level for the paraglider simulator.

This level should move away from the current procedural demo-look and become a scenic, coherent, premium-feeling playable environment suitable for first-person paraglider flight.

The visual target is a stylized-realistic alpine valley with:
- a major water body (fjord/lake/river widening)
- forested mountain slopes
- green farmland or meadow areas
- rocky ridges and cliffs
- roads, bridge(s), and a few rural buildings
- strong atmospheric distance
- believable launch and landing areas

---

## Visual Style

### Direction
Stylized-realistic alpine / fjord valley.

### Key qualities
- beautiful but believable
- premium game-environment look
- clean and readable from the air
- strong terrain layering
- natural color palette
- no primitive placeholder aesthetics

### Avoid
- low-poly debug world look
- flat terrain
- oversaturated colors
- random object placement
- generic cones as trees
- floating objects
- abstract water discs
- overly dark muddy terrain

---

## Level Composition

### Macro structure
The level should be composed of:

1. **Launch mountain**
   - elevated launch shoulder or ridge
   - dramatic but readable takeoff view
   - rocky upper slopes, sparse vegetation near top

2. **Main valley**
   - broad valley corridor for the core flight route
   - readable from FPV
   - terrain and landmarks should help player orientation

3. **Water body**
   - a lake / fjord / broad river element as a major visual anchor
   - shorelines should feel natural
   - may include small islands or inlets

4. **Forested hillsides**
   - dense conifer forest zones on appropriate slopes
   - less vegetation on steep rocky areas
   - open fields nearer settlement or landing area

5. **Landing area**
   - open field or meadow
   - clearly wind-aware
   - visible windsock
   - easy to identify during final approach

6. **Human elements**
   - a bridge
   - winding road(s)
   - sparse rural houses/farm buildings
   - these should support realism and orientation, not dominate the map

---

## Gameplay Integration

### Launch
- player starts from a scenic mountain launch
- launch should feel elevated, dramatic, and believable

### Route
- route should flow naturally through the valley
- water, ridges, forests, roads, and fields should act as navigation cues

### Gates / checkpoints
- gates should be positioned where the landscape naturally leads the player
- they should not feel arbitrarily inserted
- gate visibility must remain strong in first-person

### Thermals
- thermal zones should align with plausible terrain and sun-exposed valley structure
- they should support progression toward later gates

### Ridge lift
- ridge lift should be placed on appropriate wind-facing slopes

### Landing
- landing field should be readable from medium altitude
- windsock must clearly indicate landing direction
- final approach should be visually understandable

---

## Terrain Rules

### Height zones
- highest zones: rocky, sparse vegetation
- mid slopes: mixed grass, earth, exposed rock
- lower valley: greener meadows, forest edges, fields
- shoreline/low areas: softer transitions, flatter terrain

### Slope rules
- steep slopes: rock / cliff / scree
- moderate slopes: mixed grass-earth-rock
- flat areas: meadows, landing field, rural roads, houses

### Shape goals
- clear ridgelines
- believable valley basin
- visible terrain hierarchy from FPV
- no random noise mountains
- large forms first, detail second

---

## Vegetation Rules

### Tree type
- alpine / northern conifer style
- a few possible mixed deciduous trees near fields/water if needed

### Placement
- cluster-based
- tree lines and forest masses should follow terrain logic
- avoid trees on:
  - very steep cliffs
  - exposed rocky ridges
  - water
  - landing field
  - launch clearance zone

### Visual goals
- forests should read as masses from the air
- close silhouettes should not look like primitive cones

---

## Rock / Cliff Rules

- cliffs and rock outcrops are essential to the mountain feel
- upper launch areas and steep walls should have more exposed rock
- rock formations should help the terrain read at distance
- rocks should not look like simple polyhedrons

---

## Water Rules

- water must sit in natural low areas
- shoreline should feel believable
- water should support orientation
- bridge placement should make sense in relation to water and road

---

## Human-made Landmark Rules

### Bridge
- place at a natural crossing point
- visible from medium altitude
- should help orientation

### Roads
- follow terrain and settlement logic
- should not look like random lines

### Houses / farms
- sparse
- clustered logically near flatter land
- should add realism and scale

---

## Atmosphere / Lighting Rules

- bright clear alpine daylight
- strong directional sunlight
- atmospheric haze in the distance
- readable depth and scale
- terrain, foliage, water, and sky should share a coherent palette

---

## Technical Direction

### Performance priorities
- desktop browser first
- asset use must be controlled and scalable
- use instancing for trees where possible
- prefer a small, cohesive asset set over many unrelated assets

### Asset categories needed
- terrain textures: grass, dirt, rock, scree
- tree assets: 2–4 alpine conifer variants
- rock/cliff assets: 3–6 reusable formations
- water material / textures
- optional house/farm/bridge props
- optional road/shore detail materials

---

## Deliverable for implementation

Implement Level 01 as a scenic mountain-to-valley paraglider route with:
- one strong launch site
- one broad water landmark
- one bridge crossing
- sparse rural settlement
- forested mountain slopes
- clear landing field with windsock
- integrated gates and lift structure
- visually coherent alpine world composition