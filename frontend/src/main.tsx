import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Always start at the top on reload, so the pinned sections (About,
// Certifications) measure their positions from a known state.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);
// Some browsers still restore the old scroll position on reload; reset it just before unload.
window.addEventListener("pagehide", () => window.scrollTo(0, 0));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
