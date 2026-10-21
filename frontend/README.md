# Frontend — React + TypeScript + Vite

Real React app: `npm install`, a dev server, a build step — no CDN
shortcuts. Fetches all site content from the Flask backend at runtime
(`src/hooks/useSiteData.ts`), so editing the backend's data updates the
site without touching this project.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
```

The backend must be running separately at `http://127.0.0.1:5000` (see
`../backend/README.md`) — `vite.config.ts` proxies `/api/*` requests to
it, so `fetch("/api/site")` just works in dev with no CORS setup needed.

## Build

```bash
npm run build     # -> dist/
```

In production, either put a reverse proxy in front of both apps so `/api`
routes to Flask and everything else to this build, or set
`VITE_API_BASE_URL` (see `src/lib/api.ts`) to the backend's full URL if
they're deployed to different hosts — the backend has CORS enabled for
that case.

## Structure

```
src/
  hooks/useSiteData.ts    fetches /api/site, exposes { data, loading, error }
  lib/api.ts               resolves the API base URL (dev proxy or VITE_API_BASE_URL)
  types/site.ts            TypeScript shape of the API response
  components/
    IntroSequence.tsx      GSAP timeline driving the cinematic intro
    ParticleField.tsx      canvas dust/star field (intro + hero)
    Hud.tsx                 holographic scanning rings/brackets
    GlassTypography.tsx    "HI, I'M" + "VIJAY" glass-text reveal
    TunnelScene.tsx         three.js camera dolly through the letters
    Navbar.tsx, HeroSection.tsx, PortraitScene.tsx, FloatingCards.tsx
  content/icons.tsx         inline SVG icon set (client-side only)
  index.css                 design tokens + full stylesheet
```

See the root `README.md` for how the intro sequence works and what's
simplified vs. the full cinematic brief.
