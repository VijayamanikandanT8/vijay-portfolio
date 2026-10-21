// In dev, requests to /api are proxied to Flask by vite.config.ts, so a
// relative path just works. In production, point VITE_API_BASE_URL at
// wherever the Flask API is deployed (e.g. "https://api.example.com"),
// or leave it unset if a reverse proxy puts both under one origin.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
