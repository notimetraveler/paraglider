# Deployment (Vercel)

The paraglider simulator is a standard Next.js App Router application and deploys to Vercel without special configuration.

## Build

```bash
npm run build
```

## Deploy

1. Connect the repository to Vercel.
2. Use the default Next.js preset (no custom build command).
3. The app builds and runs as a static/SSR hybrid; the simulator route (`/simulator`) is client-rendered.

## Runtime requirements

- **Browser**: Modern desktop browser (Chrome, Firefox, Safari, Edge).
- **WebGL**: Required for Three.js rendering.
- **Audio**: Optional; works without user gesture for vario/wind/landing.
- **localStorage**: Optional; settings fall back to defaults if unavailable (private browsing, etc.).

## Environment

No environment variables are required. The app runs entirely client-side for the simulator experience.
