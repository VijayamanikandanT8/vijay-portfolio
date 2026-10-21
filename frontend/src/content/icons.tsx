import type { ReactElement } from "react";

export const Icon = {
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="m4 7 8 6 8-6" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 8-4 4 4 4" /><path d="m15 8 4 4-4 4" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 9-7 9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.4" /><path d="M5.5 20c1-3.6 3.9-5.6 6.5-5.6s5.5 2 6.5 5.6" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.2h8a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5Z" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="7.5" width="17" height="11.5" rx="1.6" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3.5 12.5h17" />
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5c.6 2.9 1.4 4.7 2.6 5.9 1.2 1.2 3 2 5.9 2.6-2.9.6-4.7 1.4-5.9 2.6-1.2 1.2-2 3-2.6 5.9-.6-2.9-1.4-4.7-2.6-5.9-1.2-1.2-3-2-5.9-2.6 2.9-.6 4.7-1.4 5.9-2.6 1.2-1.2 2-3 2.6-5.9Z" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 8.5 4.6L12 12.2 3.5 7.6 12 3Z" />
      <path d="m3.5 12 8.5 4.6L20.5 12" />
      <path d="m3.5 16.4 8.5 4.6 8.5-4.6" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  ),
  cup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
      <path d="M16 9.5h1.5a2.3 2.3 0 0 1 0 4.6H16" />
      <path d="M8 3.5c-.6.8-.6 1.4 0 2.2M11.5 3.5c-.6.8-.6 1.4 0 2.2" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5V12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V5.5" />
      <path d="M4.5 12v6.5c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V12" />
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18.5a4.3 4.3 0 0 1-1-8.47 5.5 5.5 0 0 1 10.7-2.1A4.5 4.5 0 0 1 17.5 18.5H7Z" />
    </svg>
  ),
  rocket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5c2.8 1.6 4.6 4.6 4.6 8.4 0 2-1 4.3-2 5.6l-2.6 2.6-2.6-2.6c-1-1.3-2-3.6-2-5.6 0-3.8 1.8-6.8 4.6-8.4Z" />
      <circle cx="12" cy="10.5" r="1.7" />
      <path d="M9 16.5c-1 .6-1.6 1.8-1.8 3.8 1.9-.2 3.1-.9 3.7-1.8M15 16.5c1 .6 1.6 1.8 1.8 3.8-1.9-.2-3.1-.9-3.7-1.8" />
    </svg>
  ),
  infinity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 8.5a3.5 3.5 0 1 0 0 7c1.7 0 3-1 5.5-3.5S15.8 8.5 17.5 8.5a3.5 3.5 0 1 1 0 7c-1.7 0-3-1-5.5-3.5S8.2 8.5 6.5 8.5Z" />
    </svg>
  ),
  puzzle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4.5h3.2a1.5 1.5 0 0 1 1.3 2.3 1.3 1.3 0 0 0 1.2 2h1.8A1.5 1.5 0 0 1 18 10.3v1.8a1.3 1.3 0 0 0 2 1.2 1.5 1.5 0 0 1 2.3 1.3V18a1.5 1.5 0 0 1-1.5 1.5h-3.2a1.3 1.3 0 0 1-1.1-2 1.3 1.3 0 0 0-1.1-2 1.3 1.3 0 0 0-1.1 2 1.3 1.3 0 0 1-1.1 2H9A1.5 1.5 0 0 1 7.5 18v-3.2a1.3 1.3 0 0 0-2-1.1 1.3 1.3 0 0 1-2-1.1V9.5A1.5 1.5 0 0 1 5 8h1.8a1.3 1.3 0 0 0 1.2-2A1.5 1.5 0 0 1 9 4.5Z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.2c2.4-1 5.2-1 8 .3v13c-2.8-1.3-5.6-1.3-8-.3Z" />
      <path d="M20 5.2c-2.4-1-5.2-1-8 .3v13c2.8-1.3 5.6-1.3 8-.3Z" />
    </svg>
  ),
  bulb: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17.5h6M9.8 20.5h4.4" />
      <path d="M12 3a6 6 0 0 0-3.4 10.9c.6.5 1 1.2 1 2.1h4.8c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </svg>
  ),
  fingerprint: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5 0 2 .3 3.6.8 5" />
      <path d="M12 3.5c4.7 0 8.5 3.8 8.5 8.5 0 1.2-.1 2.3-.3 3.3" />
      <path d="M12 7a5 5 0 0 0-5 5c0 3.2.8 5.6 1.8 7.3" />
      <path d="M12 7a5 5 0 0 1 5 5c0 1.7-.2 3.1-.6 4.3" />
      <path d="M12 10.5a1.5 1.5 0 0 0-1.5 1.5c0 3.6 1 6.1 2.2 8" />
      <path d="M12 10.5a1.5 1.5 0 0 1 1.5 1.5c0 1.9-.3 3.4-.8 4.7" />
    </svg>
  ),
  quote: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.5 6.5c-3 1.1-4.8 3.4-4.8 6.4 0 2.3 1.5 3.9 3.5 3.9 1.8 0 3.1-1.3 3.1-3 0-1.6-1.1-2.8-2.6-2.9.3-1.6 1.5-2.9 3-3.5L9.5 6.5Zm9 0c-3 1.1-4.8 3.4-4.8 6.4 0 2.3 1.5 3.9 3.5 3.9 1.8 0 3.1-1.3 3.1-3 0-1.6-1.1-2.8-2.6-2.9.3-1.6 1.5-2.9 3-3.5l-2.2-.9Z" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 3-9 9M21 3l-6.5 18-3.7-7.8L3 9.5 21 3Z" />
    </svg>
  ),
  mouse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="3" width="10" height="18" rx="5" />
      <path d="M12 7v3.5" />
    </svg>
  ),
};

export const TechIcon: Record<string, ReactElement> = {
  python: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.9 2c-4 0-3.8 1.7-3.8 1.7v1.8h3.9v.6H6.4S4 5.8 4 9.9c0 4.1 2.1 4 2.1 4h1.3v-1.9s-.1-2.1 2.1-2.1h3.8s2 0 2-2V4.1S15.6 2 11.9 2Zm-2.2 1.3c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7Z" />
      <path d="M12.1 22c4 0 3.8-1.7 3.8-1.7v-1.8h-3.9v-.6h5.6s2.4.3 2.4-3.8c0-4.1-2.1-4-2.1-4h-1.3v1.9s.1 2.1-2.1 2.1H10.7s-2 0-2 2v3.8S8.4 22 12.1 22Zm2.2-1.3c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7Z" />
    </svg>
  ),
  django: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3h3v13.2c-1.4.3-2.4.4-3.3.4-3.1 0-4.7-1.4-4.7-4.1 0-2.6 1.7-4.3 4.3-4.3.6 0 1 .1 1.3.2V3H9Zm0 8.4c-.3-.1-.5-.1-.8-.1-1.2 0-1.9.7-1.9 2 0 1.3.7 1.9 1.9 1.9.3 0 .5 0 .8-.1v-3.7Z" />
      <path d="M15 7.4h3V17c0 2.3-.2 3.4-.7 4.3-.5.9-1.2 1.5-2 1.9l-2.8-1.3c.9-.4 1.6-1 1.9-1.8.3-.7.6-1.7.6-3.6V7.4Zm0-4.4h3v3h-3v-3Z" />
    </svg>
  ),
  fastapi: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1.3 4-4.4 7.6H12l-1.2 6.4 5.6-8.4h-3.1L15.6 6h-2.3Z" />
    </svg>
  ),
  react: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <ellipse cx="12" cy="12" rx="10" ry="4.2" />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  postgres: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.1 2.7c-2.4-.4-4.6.3-6 1.7C9.2 3.6 6.6 3 4.7 4.4 2 6.4 2.6 11.4 3.6 15c.9 3.2 2.7 6 4.6 6 .9 0 1.5-.6 2.4-.6.8 0 1.4.6 2.3.6 1.9 0 3.6-2.5 4.6-5.6.2 0 .5.1.7.1 1.7 0 3-1.1 3-2.8 0-.9-.4-1.6-1-2.1 1-1 1.6-2.5 1.4-4.1-.3-2-1.9-3.5-4.1-3.8Z" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3.5A3.5 3.5 0 0 0 5.7 8a3 3 0 0 0-1.2 5.6A3.3 3.3 0 0 0 7.5 18a3.3 3.3 0 0 0 6 1.9A3.3 3.3 0 0 0 18.5 18a3.3 3.3 0 0 0 3-4.4A3 3 0 0 0 20.3 8 3.5 3.5 0 0 0 15 4.3a3.3 3.3 0 0 0-6 0Z" />
      <path d="M9 3.5V20M15 4.3V20" />
    </svg>
  ),
  data: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
};
