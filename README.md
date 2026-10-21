# Vijayamanikandan T. — Portfolio (React frontend + Flask backend)

Two separate, real projects that talk to each other over HTTP:

```
vijay-portfolio/
├── backend/     Flask JSON API (its own venv/requirements.txt)
└── frontend/    React + TypeScript + Vite app (its own package.json)
```

- **Backend** owns the data (name, roles, nav links, tech stack, tagline)
  and serves it at `GET /api/site`. Nothing about React lives here.
- **Frontend** is a normal Vite React app — `npm install`, dev server,
  build step. It fetches `/api/site` on load and renders from that.
  Nothing about Flask lives here beyond the fetch call.

They're connected two ways, so it works whether you run them side by
side in dev or deploy them separately later:

1. **Dev proxy** — `frontend/vite.config.ts` proxies `/api/*` to
   `http://127.0.0.1:5000`, so `fetch("/api/site")` just works with no
   CORS setup while both run locally.
2. **CORS** — `backend/app.py` has `flask-cors` enabled, so the frontend
   can also call the backend directly cross-origin (different port or
   host) if you skip the proxy or deploy them separately.

## Run both

```bash
# terminal 1
cd backend
pip install -r requirements.txt
python app.py            # -> http://127.0.0.1:5000

# terminal 2
cd frontend
npm install
npm run dev               # -> http://localhost:5173
```

Open **http://localhost:5173** — that's the React app, pulling its
content live from the Flask API.

## The cinematic intro

Same signature sequence as before: black screen → particles → HUD →
boot lines → "HI, I'M" → glass "VIJAY" → a real three.js camera dolly
through five glowing letter planes (V-I-J-A-Y, each with its own
tunnel-ring color) → flash → hero. `prefers-reduced-motion` skips
straight to the hero; there's a "Skip intro" button too.

True extruded/bevelled 3D letter architecture with portrait fragments
cut into the tunnel walls is a dedicated VFX build, not a web sprint —
this keeps the actual signature beat (camera flying through translucent
3D letters) real, using lightweight three.js primitives so it stays
fast. `frontend/src/components/TunnelScene.tsx` is where to push it
further if you want more.

## Editing content

Everything text-based (name, tagline, nav links, tech stack, boot
messages) lives in `backend/app.py`. Edit it, restart Flask, refresh the
browser — no frontend rebuild needed.

Everything visual (colors, fonts, layout, the intro choreography) lives
in `frontend/src/` — `index.css` for styling, `components/` for
behavior.
