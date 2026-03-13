# Alpine asset sourcing — Stap 28

**Doel:** Legale, hoogwaardige environment-assets voor een stylized-realistic alpine wereld. Alleen bronnen met duidelijke, game-vriendelijke licenties.

---

## 1. Aanbevolen bronnen en licenties

### 1.1 AmbientCG (textures)

- **URL:** https://ambientcg.com/
- **Licentie:** CC0 1.0 Universal (Public Domain)
- **Commercieel:** Ja
- **Attributie:** Niet verplicht (wel gewaardeerd)
- **Gebruik:** Terrain (grass, ground, rock), bark, water-achtige materialen. PBR (albedo, normal, etc.); voor ons volstaat vaak albedo/diffuse (JPG/PNG). Resolutions 1K–2K voor browser.
- **Veiligheid:** Zeer duidelijk; officiële docs: https://docs.ambientcg.com/license/

**Concrete aanbevelingen (CC0):**
- Ground/Grass: bv. Ground037, Ground030, ForestFloor012
- Rock/Stone: Rock032, Rock048, Cliff006
- Bark: Wood049, Bark007

### 1.2 Kenney (Nature Kit, textures)

- **URL:** https://kenney.nl/assets/nature-kit
- **Licentie:** CC0 (Public Domain)
- **Commercieel:** Ja
- **Attributie:** Niet verplicht
- **Gebruik:** 3D-modellen (bomen, rotsen, foliage) + texturen. Eén consistente stijl; ideaal voor low-poly browser.
- **Veiligheid:** Zeer betrouwbaar; Kenney is standaard voor game jam / indie.

### 1.3 Quaternius (itch.io / Poly Pizza)

- **URL (itch):** https://quaternius.itch.io/ | **Poly Pizza:** https://poly.pizza/
- **Licentie:** CC0
- **Commercieel:** Ja
- **Attributie:** Niet verplicht
- **Packs:** “Textured LowPoly Trees”, “Stylized Nature MegaKit”, “150+ LowPoly Nature Models”. Bomen, rotsen, plants; FBX/OBJ/glTF.
- **Veiligheid:** Per pack op itch staat CC0; altijd op de pack-pagina controleren.

### 1.4 OpenGameArt.org (CC0-terrain)

- **URL:** https://opengameart.org/ (filter: CC0, terrain/nature)
- **Licentie:** Varieert per asset; **alleen CC0 of CC-BY (met attributie) gebruiken.**
- **Commercieel:** Bij CC0 ja; bij CC-BY ja mits attributie.
- **Voorbeelden:** “CC0 Terrain Textures”, “Photorealistic Texture Pack 3” (CC0), “Seamless Pattern Pack”.
- **Veiligheid:** Per asset licentie lezen; alleen duidelijke CC0/CC-BY kiezen.

### 1.5 Poly Pizza (3D models)

- **URL:** https://poly.pizza/
- **Licentie:** Per model; veel CC0 (o.a. Quaternius).
- **Commercieel:** Bij CC0 ja.
- **Gebruik:** Low-poly bomen, rotsen; GLTF/FBX. Filter op “Nature” en controleer licentie per model.
- **Veiligheid:** Alleen assets met expliciet CC0 of gelijkwaardig gebruiken.

---

## 2. Wat niet gebruiken (onduidelijk of niet toegestaan)

- Random Google-afbeeldingen of Pinterest: geen duidelijke rechten.
- Asset packs zonder expliciete licentie op de pagina.
- “Free for personal use only” als je commercieel wilt gebruiken.
- Bronnen waar “contact us for license” de enige optie is: niet gebruiken zonder schriftelijke toestemming.

---

## 3. Integratiestrategie (kleine, consistente set)

1. **Eén alpine look:** Kies één stijl (bv. Kenney Nature Kit óf Quaternius Stylized Nature) voor bomen/rotsen; terrain textures van één bron (bv. AmbientCG) voor consistentie.
2. **Browser:** Textures 512–1024 px; 3D-modellen low-poly (< 500 tris per tree/rock).
3. **Pipeline:** Bestaande world-kit; placeholders worden stapsgewijs vervangen door geladen textures (zie `WORLD_ASSET_PATHS`). Bij ontbrekende bestanden: fallback op procedural.
4. **Bestandsstructuur:** Zet gedownloade bestanden in `public/assets/world/` (terrain/, bark/, foliage/, rock/, water/) met de namen die in `asset-paths.ts` staan. Terrain gebruikt .jpg (zie `npm run download-world-textures`).

---

## 4. Eerste implementatie (in code)

- **Texture loader:** Probeer voor elke key in `WORLD_ASSET_PATHS` een texture te laden vanaf het pad; bij 404/fout: procedural behouden. Preload vóór `createFpvScene`.
- **Terrain:** Blijft vertex colors + één detail-/albedo-map; optioneel later multi-texture (grass/earth/rock) als we meerdere texturen willen blenden.
- **Trees/rocks:** Blijven huidige geometry; alleen material maps worden vervangen door geladen texturen (bark, foliage, rock). Later: optioneel GLB-modellen uit Kenney/Quaternius als we geometry willen vervangen.
- **Placement/collision:** Geen wijziging; gameplay en leesbaarheid ongewijzigd.

---

## 5. Reality check

- **Alleen vrije assets:** Je kunt een duidelijke, consistente alpine look bereiken met CC0 textures (AmbientCG, Kenney) en low-poly modellen (Kenney, Quaternius). Het wordt zelden “AAA”, maar wel veel beter dan pure procedural.
- **Handmatige art direction:** Kleurcorrectie en blend-tuning (terrain, fog) blijven nodig voor één geheel; dat is in code te doen.
- **Betaalde assets:** Voor één-op-één referentie-kwaliteit (foto-realistische cliffs, hero trees) zijn betaalde packs of custom art vaak nodig; niet verplicht voor een sterke upgrade.

---

## 6. Aanbevolen eerste set (concreet)

| Doel           | Bron        | Asset/naam              | Bestand in project      | Licentie |
|----------------|------------|--------------------------|--------------------------|----------|
| Terrain grass  | AmbientCG  | Ground037 of ForestFloor | terrain/grass.jpg        | CC0      |
| Terrain rock   | AmbientCG  | Rock032 of Cliff006      | terrain/rock.jpg        | CC0      |
| Terrain earth  | AmbientCG  | Ground030                | terrain/earth.jpg        | CC0      |
| Detail/scrub   | AmbientCG  | (één ground)             | terrain/detail.jpg       | CC0      |
| Bark           | AmbientCG  | Bark007 of Wood049       | bark/default.png         | CC0      |
| Foliage        | AmbientCG  | (leaf/foliage)           | foliage/default.png      | CC0      |
| Rock prop      | AmbientCG  | Rock048                  | rock/default.png         | CC0      |
| Water          | Optioneel  | (blauwe tint)            | water/surface.png        | CC0      |

**Download:** AmbientCG per-texture via https://ambientcg.com/ → kies asset → Download → 1K of 2K JPG/PNG (Color map = albedo). Hernoem naar bovenstaande bestandsnamen en plaats in `public/assets/world/<submap>/`.

**Scree:** Kan dezelfde rock texture zijn met een andere vertex blend, of een aparte texture (bijv. AmbientCG gravel/rock).

---

## 7. Licentiesamenvatting

| Bron        | Licentie | Commercieel | Attributie   |
|-------------|----------|-------------|--------------|
| AmbientCG   | CC0      | Ja          | Niet verplicht |
| Kenney      | CC0      | Ja          | Niet verplicht |
| Quaternius  | CC0      | Ja          | Niet verplicht |
| OpenGameArt | CC0/CC-BY| Ja          | Bij CC-BY wel |
| Poly Pizza  | Per asset| Bij CC0 ja  | Check per asset |

Alle aanbevolen assets in dit document zijn bewust gekozen met **duidelijke, game-vriendelijke licenties**.
