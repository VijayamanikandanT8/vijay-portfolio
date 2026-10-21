import { useEffect, useRef, type ReactNode } from "react";
import { isLite } from "../lib/perf";
import "./CustomCursor.css";

/* Page-aware cursor.
   - every page gets its own colours, ring shape, idle motion, trail and click effect
   - buttons, links, forms, sliders, drag areas and images get their own states
   - touch screens get a themed tap effect (the real finger is never replaced)
   Tag any element with data-cursor="Label" (optional data-cursor-state="view"). */

type TrailKind = "comet" | "dust" | "nodes" | "dashes" | "ink" | "glints" | "squares" | "waves" | "none";
type BurstKind = "ring" | "dash" | "hex" | "lock" | "blot" | "stamp" | "sonar" | "lines" | "dots" | "sparks" | "squares";

interface Theme {
  no: string;
  name: string;
  c1: string;
  c2: string;
  shape: string;
  trail: TrailKind;
  burst: BurstKind;
}

const THEMES: Record<string, Theme> = {
  home: { no: "00", name: "Home", c1: "#5fd8ff", c2: "#8b7bff", shape: "orbit", trail: "comet", burst: "ring" },
  about: { no: "01", name: "About", c1: "#ffb454", c2: "#ff5fae", shape: "twin", trail: "dust", burst: "dots" },
  skills: { no: "02", name: "Skills", c1: "#8b7bff", c2: "#5fd8ff", shape: "hex", trail: "nodes", burst: "hex" },
  projects: { no: "03", name: "Projects", c1: "#22d3ee", c2: "#f472b6", shape: "target", trail: "none", burst: "lock" },
  experience: { no: "04", name: "Experience", c1: "#2dd4bf", c2: "#5fa8ff", shape: "dash", trail: "dashes", burst: "dash" },
  education: { no: "05", name: "Education", c1: "#5fa8ff", c2: "#8b7bff", shape: "diamond", trail: "ink", burst: "blot" },
  certifications: { no: "06", name: "Certifications", c1: "#3ddc97", c2: "#5fd8ff", shape: "seal", trail: "none", burst: "stamp" },
  achievements: { no: "07", name: "Achievements", c1: "#ffb454", c2: "#ff3a5f", shape: "spark", trail: "glints", burst: "sparks" },
  services: { no: "08", name: "Services", c1: "#ff3a5f", c2: "#ffb454", shape: "square", trail: "squares", burst: "squares" },
  contact: { no: "09", name: "Contact", c1: "#3ddc97", c2: "#8b7bff", shape: "pulse", trail: "waves", burst: "sonar" },
  resume: { no: "CV", name: "Résumé", c1: "#14aeea", c2: "#ee4796", shape: "doc", trail: "dust", burst: "lines" },
};

const SECTION_SEL = Object.keys(THEMES)
  .filter((id) => id !== "resume")
  .map((id) => `#${id}`)
  .join(",");
const MAGNET_SEL =
  'a[href], button, [role="button"], summary, select, input[type="submit"], input[type="button"], input[type="reset"], [data-cursor-magnet]';

// which theme owns an element (the résumé page is an overlay, not a section)
function themeOf(el: Element): string | null {
  if (el.closest(".rp")) return "resume";
  const sec = el.closest(SECTION_SEL);
  return sec ? sec.id : null;
}

interface Hover {
  state: string;
  label: string;
  el: HTMLElement | null;
}
const IDLE: Hover = { state: "idle", label: "", el: null };
const BLOCK: Hover = { state: "block", label: "Disabled", el: null };

function resolve(target: EventTarget | null): Hover {
  if (!(target instanceof Element)) return IDLE;

  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged) {
    const v = tagged.dataset.cursor ?? "";
    if (v === "none") return IDLE;
    return { state: tagged.dataset.cursorState ?? "view", label: v, el: null };
  }

  // ----- forms -----
  const field = target.closest<HTMLElement>("input, textarea, select, [contenteditable='true']");
  if (field) {
    if (field instanceof HTMLInputElement) {
      const ty = field.type;
      if (ty !== "submit" && ty !== "button" && ty !== "reset" && ty !== "image") {
        if (field.disabled) return BLOCK;
        if (ty === "checkbox") return { state: "check", label: "Toggle", el: null };
        if (ty === "radio") return { state: "check", label: "Select", el: null };
        if (ty === "range") return { state: "drag", label: "Slide", el: null };
        if (ty === "file") return { state: "link", label: "Upload", el: field };
        return { state: "text", label: "", el: null };
      }
    } else if (field instanceof HTMLSelectElement) {
      return field.disabled ? BLOCK : { state: "link", label: "Choose", el: field };
    } else {
      if (field instanceof HTMLTextAreaElement && field.disabled) return BLOCK;
      return { state: "text", label: "", el: null };
    }
  }
  const lab = target.closest("label");
  if (lab && lab.querySelector('input[type="checkbox"], input[type="radio"]'))
    return { state: "check", label: "Toggle", el: null };

  // ----- special areas -----
  if (target.closest(".proj-content__nav--next")) return { state: "view", label: "Next", el: null };
  if (target.closest(".proj-content__nav--prev")) return { state: "view", label: "Prev", el: null };
  if (target.closest(".proj-stack__item:not(.proj-stack__item--empty)")) return { state: "view", label: "Open", el: null };
  if (target.closest(".sx-rail")) return { state: "drag", label: "Drag", el: null };

  const lb = target.closest<HTMLElement>(".ach-lb__img");
  if (lb) return { state: "zoom", label: lb.classList.contains("is-zoom") ? "Zoom out" : "Zoom in", el: null };
  if (target.closest(".ach-shot__btn, .ach-card__container--closed .ach-card__image"))
    return { state: "zoom", label: "Open", el: null };

  // ----- buttons and links -----
  const hit = target.closest<HTMLElement>(MAGNET_SEL);
  if (hit) {
    if ((hit instanceof HTMLButtonElement || hit instanceof HTMLInputElement) && hit.disabled) return BLOCK;
    let label = "";
    if (hit instanceof HTMLAnchorElement) {
      const href = hit.getAttribute("href") ?? "";
      if (href.startsWith("mailto:")) label = "Email";
      else if (href.startsWith("tel:")) label = "Call";
      else if (hit.hasAttribute("download")) label = "Download";
      else if (hit.target === "_blank") label = "Visit";
    } else if (
      (hit instanceof HTMLButtonElement && hit.type === "submit") ||
      (hit instanceof HTMLInputElement && hit.type === "submit")
    ) {
      label = "Send";
    }
    return { state: "link", label, el: hit };
  }
  return IDLE;
}

function Sh({ k, children }: { k: string; children: ReactNode }) {
  return (
    <g className={`vx-s vx-s--${k}`}>
      <g className="vx-under">{children}</g>
      <g className="vx-over">{children}</g>
    </g>
  );
}

/* ---------- canvas effects (trails + click bursts) ---------- */
interface P {
  k: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  rot: number;
  vr: number;
  col: string;
  delay: number;
}
type PInit = Pick<P, "k" | "x" | "y" | "life"> &
  Partial<Pick<P, "vx" | "vy" | "size" | "rot" | "vr" | "delay">> & { c?: 0 | 1 };
interface Pt {
  x: number;
  y: number;
  t: number;
}

const TAU = Math.PI * 2;
const MAXP = 150;
const TRAIL_LIFE: Partial<Record<TrailKind, number>> = { comet: 380, ink: 900, dashes: 700, nodes: 650 };
const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const;

const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const rnd = () => Math.random();

export default function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const tagInRef = useRef<HTMLSpanElement>(null);
  const ghRef = useRef<HTMLDivElement>(null);
  const gvRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const cv = fxRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const halo = haloRef.current;
    const frame = frameRef.current;
    const tag = tagRef.current;
    const tagIn = tagInRef.current;
    const gh = ghRef.current;
    const gv = gvRef.current;
    if (!root || !cv || !dot || !ring || !halo || !frame || !tag || !tagIn || !gh || !gv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const html = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const trailOn = !reduce && !isLite();
    const burstOn = !reduce;

    let mx = -200;
    let my = -200;
    let rx = mx;
    let ry = my;
    let hx = mx;
    let hy = my;
    let raf = 0;
    let shown = false;
    let mouseMode = false;
    let lastType = "mouse";

    let theme = "";
    let cur: Theme = THEMES.home;
    let state = "idle";
    let hoverLabel = "";
    let announcing = false;
    let tagTimer = 0;
    let scrollTimer = 0;
    let tagW = 0;

    let magnetEl: HTMLElement | null = null;
    let magnetRadius = 16;
    let fw = 0;
    let fh = 0;

    /* ================= canvas fx ================= */
    const ps: P[] = [];
    const pts: Pt[] = [];
    let vw = 0;
    let vh = 0;
    let fxRaf = 0;
    let last = 0;
    let acc = 0;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      cv.width = Math.round(vw * dpr);
      cv.height = Math.round(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // cursor scales with the screen: a bit smaller on laptops, bigger on large monitors
      const u = Math.max(0.82, Math.min(1.25, vw / 1440));
      root.style.setProperty("--u", u.toFixed(3));
    };

    const strokeBoth = (w: number, col: string, a: number) => {
      const al = clamp01(a);
      ctx.globalAlpha = al * 0.5;
      ctx.strokeStyle = "#070916";
      ctx.lineWidth = w + 2.4;
      ctx.stroke();
      ctx.globalAlpha = al;
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.stroke();
    };
    const blob = (x: number, y: number, r: number, col: string, a: number) => {
      const al = clamp01(a);
      ctx.beginPath();
      ctx.arc(x, y, r + 1, 0, TAU);
      ctx.globalAlpha = al * 0.5;
      ctx.fillStyle = "#070916";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.globalAlpha = al;
      ctx.fillStyle = col;
      ctx.fill();
    };
    const poly = (x: number, y: number, r: number, n: number, rot: number) => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const an = rot + (i / n) * TAU;
        const px = x + Math.cos(an) * r;
        const py = y + Math.sin(an) * r;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
    };
    const star = (x: number, y: number, s: number, rot: number, col: string, a: number) => {
      const path = (r: number) => {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const rr = i % 2 === 0 ? r : r * 0.28;
          const an = rot + (i * Math.PI) / 4 - Math.PI / 2;
          const px = x + Math.cos(an) * rr;
          const py = y + Math.sin(an) * rr;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.closePath();
      };
      const al = clamp01(a);
      path(s * 1.3);
      ctx.globalAlpha = al * 0.5;
      ctx.fillStyle = "#070916";
      ctx.fill();
      path(s);
      ctx.globalAlpha = al;
      ctx.fillStyle = col;
      ctx.fill();
    };

    const drawP = (p: P, t: number, dt: number) => {
      const drag = 1 - Math.min(dt * 3.4, 0.9);
      switch (p.k) {
        case "ring": {
          ctx.beginPath();
          ctx.arc(p.x, p.y, (6 + ease(t) * 52) * p.size, 0, TAU);
          strokeBoth(2.2 * (1 - t) + 0.6, p.col, 1 - t);
          break;
        }
        case "dash": {
          ctx.setLineDash([5, 6]);
          ctx.lineDashOffset = -p.age * 0.05;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8 + ease(t) * 48, 0, TAU);
          strokeBoth(2, p.col, 1 - t);
          ctx.setLineDash([]);
          break;
        }
        case "hex": {
          poly(p.x, p.y, (6 + ease(t) * 50) * p.size, 6, t * 0.8);
          strokeBoth(1.9 * (1 - t) + 0.6, p.col, 1 - t);
          break;
        }
        case "lock": {
          const s = 46 - ease(Math.min(t * 1.7, 1)) * 30;
          const arm = 9;
          const a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
          ctx.beginPath();
          for (const [sx, sy] of CORNERS) {
            ctx.moveTo(p.x + sx * s, p.y + sy * (s - arm));
            ctx.lineTo(p.x + sx * s, p.y + sy * s);
            ctx.lineTo(p.x + sx * (s - arm), p.y + sy * s);
          }
          strokeBoth(2.2, p.col, a);
          break;
        }
        case "blot": {
          const r = 6 + ease(t) * 38;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.globalAlpha = clamp01((1 - t) * 0.28);
          ctx.fillStyle = p.col;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          strokeBoth(1.4, p.col, (1 - t) * 0.8);
          break;
        }
        case "stamp": {
          const R = 24;
          const k = t < 0.28 ? 1.55 - 0.55 * ease(t / 0.28) : 1;
          const a = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
          ctx.beginPath();
          ctx.arc(p.x, p.y, R * k, 0, TAU);
          ctx.moveTo(p.x + (R - 6) * k, p.y);
          ctx.arc(p.x, p.y, (R - 6) * k, 0, TAU);
          strokeBoth(2, p.col, a);
          ctx.setLineDash([2, 5]);
          ctx.lineDashOffset = -p.age * 0.02;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (R + 6) * k, 0, TAU);
          strokeBoth(1.6, p.col, a * 0.9);
          ctx.setLineDash([]);
          star(p.x, p.y, 7 * k, 0.2, p.col, a);
          break;
        }
        case "lines": {
          for (let i = -1; i <= 1; i++) {
            const half = ease(t) * (i === 0 ? 36 : 27);
            ctx.beginPath();
            ctx.moveTo(p.x - half, p.y + i * 9);
            ctx.lineTo(p.x + half, p.y + i * 9);
            strokeBoth(2, p.col, 1 - t);
          }
          break;
        }
        case "dot": {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= drag;
          p.vy *= drag;
          blob(p.x, p.y, p.size * (1 - t * 0.6), p.col, 1 - t);
          break;
        }
        case "streak": {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= drag;
          p.vy *= drag;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
          strokeBoth(2 * (1 - t) + 0.5, p.col, 1 - t);
          break;
        }
        case "glint": {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          star(p.x, p.y, p.size * Math.sin(t * Math.PI) + 0.5, p.rot, p.col, 1);
          break;
        }
        case "sq": {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= drag;
          p.vy *= drag;
          p.rot += p.vr * dt;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
          strokeBoth(1.6, p.col, 1 - t);
          ctx.restore();
          break;
        }
        case "dust": {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          blob(p.x, p.y, p.size * (1 - t), p.col, (1 - t) * 0.9);
          break;
        }
        case "wave": {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 + ease(t) * 26, 0, TAU);
          strokeBoth(1.4, p.col, (1 - t) * 0.8);
          break;
        }
        default:
          break;
      }
    };

    const drawTrail = (now: number) => {
      const kind = cur.trail;
      const life = TRAIL_LIFE[kind] ?? 400;
      while (pts.length && now - pts[0].t > life) pts.shift();
      if (pts.length < 2) return;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const f = clamp01(1 - (now - b.t) / life);
        if (f <= 0) continue;
        const frac = i / pts.length;
        if (kind === "comet") {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          strokeBoth(1 + f * 4.2, frac > 0.55 ? cur.c1 : cur.c2, f * 0.9);
        } else if (kind === "ink") {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          strokeBoth(0.8 + f * 2.6, cur.c2, f * 0.8);
        } else if (kind === "dashes") {
          if (i % 2 === 0) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            strokeBoth(2.2, cur.c1, f);
          }
        } else if (kind === "nodes") {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          strokeBoth(1, cur.c1, f * 0.7);
          if (i % 4 === 0) blob(b.x, b.y, 2.6, cur.c2, f);
        }
      }
    };

    const frameFx = (now: number) => {
      fxRaf = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, vw, vh);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      drawTrail(now);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        if (p.delay > 0) {
          p.delay -= dt * 1000;
          continue;
        }
        p.age += dt * 1000;
        const t = p.age / p.life;
        if (t >= 1) {
          ps.splice(i, 1);
          continue;
        }
        drawP(p, t, dt);
      }
      ctx.globalAlpha = 1;
      if (pts.length || ps.length) fxRaf = requestAnimationFrame(frameFx);
      else ctx.clearRect(0, 0, vw, vh);
    };

    const kick = () => {
      if (fxRaf) return;
      last = performance.now();
      fxRaf = requestAnimationFrame(frameFx);
    };

    const spawn = (o: PInit) => {
      if (ps.length >= MAXP) ps.shift();
      const { c, ...rest } = o;
      ps.push({ vx: 0, vy: 0, size: 1, rot: 0, vr: 0, delay: 0, ...rest, age: 0, col: c ? cur.c2 : cur.c1 });
      kick();
    };

    // the click / tap effect, different on every page
    const burst = (x: number, y: number) => {
      if (!burstOn) return;
      switch (cur.burst) {
        case "ring":
          spawn({ k: "ring", x, y, life: 620 });
          spawn({ k: "ring", x, y, life: 620, delay: 90, c: 1, size: 0.6 });
          break;
        case "dash":
          spawn({ k: "dash", x, y, life: 760 });
          break;
        case "hex":
          spawn({ k: "hex", x, y, life: 640 });
          spawn({ k: "hex", x, y, life: 640, delay: 100, c: 1, size: 0.6 });
          break;
        case "lock":
          spawn({ k: "lock", x, y, life: 560 });
          break;
        case "blot":
          spawn({ k: "blot", x, y, life: 720 });
          break;
        case "stamp":
          spawn({ k: "stamp", x, y, life: 900 });
          break;
        case "lines":
          spawn({ k: "lines", x, y, life: 600 });
          break;
        case "sonar":
          for (let i = 0; i < 3; i++) spawn({ k: "ring", x, y, life: 800, delay: i * 140, c: i % 2 === 0 ? 0 : 1 });
          break;
        case "dots":
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * TAU + rnd() * 0.4;
            const sp = 70 + rnd() * 90;
            spawn({ k: "dot", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 640 + rnd() * 200, size: 2 + rnd() * 2.4, c: i % 2 === 0 ? 0 : 1 });
          }
          break;
        case "sparks":
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * TAU + rnd() * 0.3;
            const sp = 130 + rnd() * 150;
            spawn({ k: "streak", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 520 + rnd() * 160, c: i % 2 === 0 ? 0 : 1 });
          }
          for (let i = 0; i < 4; i++) {
            const a = rnd() * TAU;
            spawn({ k: "glint", x, y, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, life: 700, size: 5 + rnd() * 5, rot: rnd(), vr: (rnd() - 0.5) * 3, c: i % 2 === 0 ? 0 : 1 });
          }
          break;
        case "squares":
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU + rnd() * 0.5;
            const sp = 90 + rnd() * 110;
            spawn({ k: "sq", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 700, size: 5 + rnd() * 4, rot: rnd() * 3, vr: (rnd() - 0.5) * 8, c: i % 2 === 0 ? 0 : 1 });
          }
          break;
        default:
          break;
      }
    };

    // the mouse trail, different on every page
    const emit = (x: number, y: number, dx: number, dy: number) => {
      if (!trailOn) return;
      const k = cur.trail;
      if (k === "none") return;
      if (k === "comet" || k === "ink" || k === "dashes" || k === "nodes") {
        const l = pts[pts.length - 1];
        if (!l || Math.hypot(x - l.x, y - l.y) > 4) {
          pts.push({ x, y, t: performance.now() });
          if (pts.length > 48) pts.shift();
          kick();
        }
        return;
      }
      acc += Math.hypot(dx, dy);
      const step = k === "dust" ? 14 : k === "glints" ? 26 : k === "squares" ? 30 : 40;
      if (acc < step) return;
      acc = 0;
      const c: 0 | 1 = rnd() < 0.5 ? 0 : 1;
      if (k === "dust")
        spawn({ k: "dust", x, y, vx: (rnd() - 0.5) * 26, vy: -8 - rnd() * 22, life: 800 + rnd() * 500, size: 1.4 + rnd() * 2.2, c });
      else if (k === "glints")
        spawn({ k: "glint", x, y, vx: (rnd() - 0.5) * 20, vy: -6 - rnd() * 14, life: 620 + rnd() * 300, size: 4 + rnd() * 5, rot: rnd(), vr: (rnd() - 0.5) * 3, c });
      else if (k === "squares")
        spawn({ k: "sq", x, y, vx: (rnd() - 0.5) * 20, vy: 14 + rnd() * 22, life: 760, size: 5 + rnd() * 5, rot: rnd() * 3, vr: (rnd() - 0.5) * 4, c });
      else if (k === "waves") spawn({ k: "wave", x, y, life: 700, c });
    };

    /* ================= cursor ================= */
    const renderTag = () => {
      let on = false;
      if (hoverLabel) {
        tagIn.textContent = hoverLabel;
        on = true;
      } else if (announcing && THEMES[theme]) {
        const b = document.createElement("b");
        b.textContent = THEMES[theme].no;
        tagIn.replaceChildren(b, document.createTextNode(THEMES[theme].name));
        on = true;
      }
      tag.classList.toggle("is-on", on);
      if (on) tagW = tagIn.offsetWidth;
    };

    const setTheme = (id: string, announce: boolean) => {
      const t = THEMES[id];
      if (!t || id === theme) return;
      theme = id;
      cur = t;
      acc = 0;
      root.style.setProperty("--c1", t.c1);
      root.style.setProperty("--c2", t.c2);
      root.dataset.shape = t.shape;
      root.dataset.theme = id;
      if (announce) {
        announcing = true;
        renderTag();
        window.clearTimeout(tagTimer);
        tagTimer = window.setTimeout(() => {
          announcing = false;
          renderTag();
        }, 1700);
      }
    };

    const applyHover = (h: Hover) => {
      let next = h.state;
      let el: HTMLElement | null = null;
      if (next === "link" && h.el) {
        const r = h.el.getBoundingClientRect();
        if (r.width <= 340 && r.height <= 96) {
          next = "magnet";
          el = h.el;
        }
      }
      if (next === state && h.label === hoverLabel && el === magnetEl) return;

      state = next;
      hoverLabel = h.label;
      magnetEl = el;
      root.dataset.state = state;

      if (el) {
        const br = getComputedStyle(el).borderTopLeftRadius;
        magnetRadius = br.includes("%") ? 999 : (parseFloat(br) || 0) + 6;
        fw = 0;
      }
      renderTag();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      raf = 0;
      let tx = mx;
      let ty = my;
      let offX = 30;
      let offY = 24;

      if (magnetEl) {
        if (!magnetEl.isConnected) {
          applyHover(IDLE);
        } else {
          const r = magnetEl.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          tx = cx + (mx - cx) * 0.18;
          ty = cy + (my - cy) * 0.22;
          const w = Math.round(r.width + 16);
          const h = Math.round(r.height + 12);
          if (w !== fw || h !== fh) {
            fw = w;
            fh = h;
            frame.style.width = `${w}px`;
            frame.style.height = `${h}px`;
            frame.style.borderRadius = `${Math.min(magnetRadius + 4, h / 2)}px`;
          }
          offX = -w / 2;
          offY = h / 2 + 10;
        }
      }

      rx += (tx - rx) * 0.2;
      ry += (ty - ry) * 0.2;
      hx += (mx - hx) * 0.07;
      hy += (my - hy) * 0.07;

      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      halo.style.transform = `translate3d(${hx}px,${hy}px,0)`;

      let tgx = rx + offX;
      if (!magnetEl && tgx + tagW > window.innerWidth - 10) tgx = rx - 30 - tagW;
      tag.style.transform = `translate3d(${tgx}px,${ry + offY}px,0)`;

      const moving =
        Math.abs(tx - rx) > 0.08 || Math.abs(ty - ry) > 0.08 || Math.abs(mx - hx) > 0.08 || Math.abs(my - hy) > 0.08;
      if (moving || magnetEl) raf = requestAnimationFrame(tick);
    };

    // mouse / pen => custom cursor on. finger => system behaviour, tap effect only.
    const setMouse = (on: boolean) => {
      if (on === mouseMode) return;
      mouseMode = on;
      html.classList.toggle("vx-on", on);
      if (!on) {
        shown = false;
        root.classList.remove("is-shown");
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        setMouse(false);
        return;
      }
      setMouse(true);
      const first = !shown;
      const dx = e.clientX - mx;
      const dy = e.clientY - my;
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      if (theme === "projects") {
        gh.style.transform = `translate3d(0,${my}px,0)`;
        gv.style.transform = `translate3d(${mx}px,0,0)`;
      }
      if (first) {
        shown = true;
        rx = hx = mx;
        ry = hy = my;
        root.classList.add("is-shown");
      } else {
        emit(mx, my, dx, dy);
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const t = e.target;
      if (t instanceof Element) {
        const id = themeOf(t);
        if (id) setTheme(id, true);
      }
      applyHover(resolve(t));
    };

    const onDown = (e: PointerEvent) => {
      lastType = e.pointerType;
      if (e.pointerType === "touch") return;
      root.dataset.down = "1";
      burst(e.clientX, e.clientY);
    };
    const onUp = () => {
      delete root.dataset.down;
    };

    // a tap (not a scroll swipe) on a touch screen: themed burst
    const onClick = (e: MouseEvent) => {
      if (lastType !== "touch" || e.detail === 0) return;
      const t = e.target;
      if (t instanceof Element) {
        const id = themeOf(t);
        if (id) setTheme(id, false);
      }
      burst(e.clientX, e.clientY);
    };

    const hide = () => {
      shown = false;
      root.classList.remove("is-shown");
    };

    // page scrolled under a still pointer (window OR the résumé overlay): re-check what is below it
    const onScroll = () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        if (!shown) return;
        const el = document.elementFromPoint(mx, my);
        if (!el) return;
        const id = themeOf(el);
        if (id) setTheme(id, true);
        applyHover(resolve(el));
      }, 110);
    };

    fit();
    setTheme("home", false);
    root.dataset.state = "idle";

    window.addEventListener("resize", fit, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("blur", hide);
    html.addEventListener("mouseleave", hide);

    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("blur", hide);
      html.removeEventListener("mouseleave", hide);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(fxRaf);
      window.clearTimeout(tagTimer);
      window.clearTimeout(scrollTimer);
      html.classList.remove("vx-on");
    };
  }, []);

  return (
    <div className="vx" ref={rootRef} data-theme="home" data-shape="orbit" data-state="idle" aria-hidden="true">
      <canvas className="vx-fx" ref={fxRef} />

      <div className="vx-cur">
        <div className="vx-gh" ref={ghRef} />
        <div className="vx-gv" ref={gvRef} />
        <div className="vx-halo" ref={haloRef} />

        <div className="vx-ring" ref={ringRef}>
          <div className="vx-frame" ref={frameRef} />
          <div className="vx-box">
            <i className="vx-fill" />
            <svg className="vx-svg" viewBox="0 0 64 64">
              <defs>
                <linearGradient id="vxGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" style={{ stopColor: "var(--c1)" }} />
                  <stop offset="1" style={{ stopColor: "var(--c2)" }} />
                </linearGradient>
              </defs>
              <g className="vx-spin">
                <Sh k="orbit">
                  <circle cx="32" cy="32" r="26" />
                  <circle className="sat" cx="32" cy="6" r="3.2" />
                </Sh>
                <Sh k="twin">
                  <circle cx="32" cy="32" r="26" />
                  <circle className="sat" cx="32" cy="6" r="3.2" />
                  <circle className="sat" cx="32" cy="58" r="3.2" />
                </Sh>
                <Sh k="hex">
                  <polygon points="32,5 55.4,18.5 55.4,45.5 32,59 8.6,45.5 8.6,18.5" />
                </Sh>
                <Sh k="target">
                  <circle cx="32" cy="32" r="21" />
                  <path d="M32 3v11M32 50v11M3 32h11M50 32h11" />
                </Sh>
                <Sh k="dash">
                  <circle cx="32" cy="32" r="26" strokeDasharray="7 7" />
                </Sh>
                <Sh k="diamond">
                  <polygon points="32,4 60,32 32,60 4,32" />
                </Sh>
                <Sh k="seal">
                  <circle cx="32" cy="32" r="26" strokeDasharray="1.5 5.2" />
                  <circle cx="32" cy="32" r="19" />
                </Sh>
                <Sh k="spark">
                  <path d="M32 3C34 22 42 30 61 32 42 34 34 42 32 61 30 42 22 34 3 32 22 30 30 22 32 3Z" />
                </Sh>
                <Sh k="square">
                  <rect x="8" y="8" width="48" height="48" rx="13" />
                </Sh>
                <Sh k="doc">
                  <path d="M17 6h21l11 11v37a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4zM38 6v11h11M21 31h22M21 39h22M21 47h13" />
                </Sh>
                <g className="vx-s vx-s--pulse">
                  <g className="vx-under">
                    <circle cx="32" cy="32" r="20" />
                  </g>
                  <g className="vx-over">
                    <circle cx="32" cy="32" r="20" />
                  </g>
                  <circle className="vx-ping" cx="32" cy="32" r="22" />
                </g>
              </g>
            </svg>
          </div>
        </div>

        <div className="vx-dot" ref={dotRef} />

        <div className="vx-tag" ref={tagRef}>
          <span className="vx-tag__in" ref={tagInRef} />
        </div>
      </div>
    </div>
  );
}