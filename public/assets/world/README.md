# World assets (alpine environment)

Place texture files here to replace procedural placeholders.

**Quick setup (CC0 textures from AmbientCG):**

```bash
npm install -D adm-zip
node scripts/download-world-textures.mjs
```

This downloads terrain textures (grass, earth, rock, scree, detail) as JPG into `terrain/`. Restart the dev server and hard-refresh to see them.

**Required names:**

- **terrain/** — `grass.jpg`, `earth.jpg`, `rock.jpg`, `scree.jpg`, `detail.jpg` (from script above, or add your own)
- **bark/** — `default.png`
- **foliage/** — `default.png`
- **rock/** — `default.png`
- **water/** — `surface.png`, `shore.png`

See **docs/superpowers/specs/2026-03-13-alpine-asset-sourcing.md** for sources and licenses.

If a file is missing, the simulator falls back to procedural textures.
