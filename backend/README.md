# Backend — Flask JSON API

A plain Flask app that knows nothing about React. It exposes:

- `GET /api/site` — all site content (name, roles, nav links, tech stack,
  tagline). Edit the dictionaries at the top of `app.py` to change any
  copy on the site — no frontend changes needed.
- `GET /api/health` — basic health check.

## Run

```bash
pip install -r requirements.txt
python app.py
```

Runs on **http://127.0.0.1:5000**.

CORS is enabled (`flask-cors`) so the frontend can call this API directly
from a different origin/port — useful if you run `npm run dev` without
the Vite proxy, or deploy the two apps to different hosts.
