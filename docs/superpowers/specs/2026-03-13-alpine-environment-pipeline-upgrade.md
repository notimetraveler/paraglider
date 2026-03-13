# Alpine environment pipeline upgrade — Stap 28

**Doel:** Van procedural placeholder world naar een high-quality stylized-realistic alpine environment die dichter bij een professionele game-look komt.

**Referentie:** Alpine paraglider-omgeving met sterke bergvormen, rotsige kliffen, groene valleien, atmosferische diepte en hoogwaardige world presentation. Paraglider-besturing en flight feel blijven ongewijzigd.

---

## 1. Analyse — waarom de huidige pipeline visueel niet in de buurt komt

- **Terrain:** Hoogte komt uit een combinatie van gaussische heuvels en ridge-bands; vormen zijn zacht en “blob-achtig”. Geen scherpe kammen, geen duidelijke kliffen of geërodeerde wanden. Micro-noise is beperkt; het terrein voelt vlak en weinig gedetailleerd.
- **Kleur en licht:** Palet is relatief donker (gras 0x3d6b2f, rots 0x5c5c5c, zenith 0x4a8ab8). Hemel en terrein missen de “ochtend-alpen” helderheid en contrast van de referentie.
- **Atmosfeer:** Eén lineaire mist en een simpele sky-gradient. Geen verre berglagen, geen luchtperspectief of gelaagde diepte; afstand wordt alleen door mist gedempt.
- **Assets:** Bomen zijn kegels + cilinders, rotsen icosahedron/dodecahedron. Geen cliff/outcrop-vormen, geen rijke props; alles is low-poly placeholder.
- **Compositie:** Launch, route en LZ zijn functioneel (duidelijk voor gameplay) maar niet visueel gecomponeerd voor een sterke FPV-ervaring (geen duidelijke “clearing”, geen sterke landmarks).

---

## 2. Vijf grootste blockers

1. **Terrain-vorm is procedural blobs** — Geen heightmap- of sculpted-achtige look; richels en kliffen zijn zachte banden, niet scherp of gelaagd. Dit beperkt het “berg- en klifgevoel” het meest.
2. **Materialen en licht te donker/vlak** — Terreinen en hemel voelen gedempt; geen sterke alpine-ochtend sfeer of duidelijke materiaalzones (gras/rots/earth).
3. **Geen atmosferische diepte** — Eén mistlaag, geen verre berglagen of luchtperspectief, waardoor schaal en diepte beperkt blijven.
4. **Primitieve environment-assets** — Bomen/rotsen zijn simpele primitives; geen cliff/outcrop-geometrie of rijkere props; zonder externe assets blijft dit een hard plafond.
5. **World composition functioneel, niet scenisch** — Launch/LZ/route zijn leesbaar maar niet gecomponeerd voor een “wow”-FPV; weinig visuele hiërarchie of landmerkwerking.

---

## 3. Concreet upgradeplan (niet alleen placeholder geometry)

### 3.1 Terrain pipeline (in code)

- **Eén bron van waarheid:** `terrainHeightAt()` blijft de enige hoogtebron (collision, HUD, rendering).
- **Scherpere vormen:** Ridge- en wall-termen verfijnen met scherpere falloffs of ridge-achtige functies zodat kammen en wanden duidelijker en minder zacht zijn.
- **Rijkere micro-variatie:** Extra of sterkere noise-octaven op richels/slopes om oppervlaktedetail te vergroten zonder de grote vormen te breken.
- **Geen externe heightmap in deze stap:** Blijft puur wiskundig; later kan een echte heightmap worden geïntegreerd via dezelfde API.

### 3.2 Material pipeline (in code)

- **Helderder palet:** Sky, fog en terreinkleuren iets optillen richting referentie (meer helder blauw, lichter groen/grijs) binnen ART_DIRECTION.
- **Duidelijkere zones:** Bestaande biome-blending behouden; contrast tussen gras/earth/rock/scree iets verhogen zodat zones vanuit FPV duidelijker lezen.

### 3.3 Atmosfeer en verre scenery (in code)

- **Helderdere sky/fog:** Zenith/horizon en mistkleur en -sterkte aanpassen voor meer diepte en “ochtend”-gevoel.
- **Verre berglaag:** Eén (of twee) eenvoudige distant-mountain mesh(s) of plane(s) achter het hoofdterrein, met sterke mist en blauwe tint voor luchtperspectief.

### 3.4 Environment dressing (beperkt in code)

- **Zonder externe modellen:** Meer variatie in schaal/rotatie van bestaande bomen/rotsen; optioneel eenvoudige “cliff-proxy”-meshes (bijv. gekantelde box of simpele vorm) bij bestaande ridge-posities om richels visueel te versterken.
- **Met externe assets (later):** Echte bomen, rotsen, cliff/outcrop-modellen (GLTF/FBX of atlased sprites) voor de echte kwaliteitssprong.

### 3.5 World composition (in code)

- **Launch:** Subtiele visuele nadruk (bijv. iets lichtere vertexkleur of kleine clearing-ring) zonder gameplay te veranderen.
- **LZ:** Blijft leesbaar; eventueel subtiele rand of tint zodat het als “landing meadow” leest.
- **Route/gates:** Geen gameplaywijziging; positie en leesbaarheid behouden.

---

## 4. Wat nog niet haalbaar is zonder externe assets

- **Hoogwaardige bomen en rotsen:** Echte silhouetten, bark/foliage/rock detail vragen om texturen en/of 3D-modellen.
- **Cliff/outcrop-vormen:** Echte geërodeerde kliffen en rotswanden vragen om sculpted meshes of normal-mapped vlakken.
- **Optioneel:** Fysieke heightmap (image) voor terrain voor nog natuurlijker bergvormen; huidige aanpak blijft procedural.

---

## 5. Volgorde van uitvoering

1. Terrain: scherpere ridge/wall-termen + sterkere micro-detail.
2. Atmosfeer: helderder sky/fog + distant mountain layer(s).
3. Materialen: helderder palet en duidelijker zones.
4. Compositie: launch/LZ subtiele visuele nadruk.
5. Environment: extra variatie en optionele cliff-proxies (minimaal).

Tests, lint, typecheck en build na elke stap; geen wijzigingen aan paraglider-besturing of flight feel.

---

## 6. Uitgevoerde wijzigingen (Stap 28)

- **Terrain:** Scherpere ridge-banden (smallere acrossFalloff voor launchRidge, westWall, eastWall, secondWall), ridged-detailterm (ridge-style noise) voor meer oppervlaktedetail op hoogte, iets sterkere microNoise.
- **Atmosfeer:** Helderder sky gradient (zenith 0x6ba3d4, horizon 0xb8d8f0), fog (0xb0d4ec, near 420, far 2500), hemisphere en sun/fill verhoogd; distant mountain layer (twee vlakken achter het speelveld, blauwgrijs, fog-aware).
- **Materialen:** Terrain vertex-kleuren helderder (gras, earth, rock, scree); launch platform, LZ, ridge-wand afgestemd op hetzelfde palet.
- **Compositie:** LZ-meadow en launch-stone iets duidelijker leesbaar; ridge-materiaal consistent met rock-palet.

---

## 7. Wat nog niet haalbaar is zonder externe assets

- **Hoogwaardige bomen en rotsen:** Echte silhouetten, bark/foliage/rock-detail vragen om texturen en/of 3D-modellen (GLTF/FBX of atlased sprites).
- **Cliff/outcrop-vormen:** Geërodeerde kliffen en rotswanden vragen om sculpted meshes of normal-mapped vlakken.
- **Optioneel:** Fysieke heightmap (image) voor nog natuurlijker bergvormen; huidige aanpak blijft procedural.

---

## 8. Welke assets/types nodig zijn

- **Trees:** Low-poly conifer-modellen (1–3 LODs) met bark- en foliage-textures, of atlased billboards.
- **Rocks:** Enkele rots-/outcrop-meshes met albedo/normal (optioneel) voor richels en dal.
- **Cliffs:** Optioneel cliff-mesh of decals met normal maps voor steile wanden.
- **Terrain (optioneel):** Heightmap + eventueel splat maps voor grass/earth/rock als je van procedural wilt overschakelen.

---

## 9. Zichtbare verbetering die al in code is gerealiseerd

- Scherpere bergkammen en wanden; meer oppervlaktedetail op bergen (ridged noise).
- Helderder, “alpine ochtend”-achtige hemel, mist en licht; betere leesbaarheid.
- Verre berglaag voor atmosferische diepte en schaal.
- Duidelijker materiaalzones (gras/earth/rock) en consistenter, helderder palet.
- Launch- en LZ-gebied visueel duidelijker zonder gameplay te veranderen.

---

## 10. Beste volgende concrete stap

1. **In browser beoordelen:** Vlieg de huidige wereld en check ridge-scherpte, distant layer, helderheid en LZ/launch.
2. **Daarna:** Ofwel (a) eerste externe assets introduceren (bijv. één set tree + rock textures of een simpel GLTF-rotsmodel) en in de world-kit integreren, ofwel (b) terrain-segmenten verhogen voor meer geometrisch detail, ofwel (c) tweede distant layer met “pieken”-silhouet (procedural of texture) voor nog meer diepte.
