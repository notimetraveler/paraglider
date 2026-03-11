# Paraglider Simulator

First-person paraglider flight simulator for the browser. Built with Next.js, Three.js, and TypeScript. Deployable on Vercel.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **Launch Simulator**.

## Controls

| Key | Action |
|-----|--------|
| ← → | Steer |
| ↑ | Accelerate (speed bar) |
| ↓ | Brake |
| A / D / W / X | Look around |
| S | Look forward |
| P | Pause |
| C | Camera (FPV → TPV → Top) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Unit and integration tests |
| `npm run test:e2e` | Playwright E2E tests |

## Deploy on Vercel

Connect the repo to Vercel; the default Next.js preset works. See [docs/DEPLOY.md](docs/DEPLOY.md) for details.
