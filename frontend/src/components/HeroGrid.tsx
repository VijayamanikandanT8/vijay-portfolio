import { useEffect, useRef } from "react";
import { isLite } from "../lib/perf";

const CELL = 64; // must match background-size of .hv-gridlines
const STOPS: [number, number, number][] = [
  [20, 174, 234],
  [109, 93, 252],
  [238, 71, 150],
];
const DIRS: [number, number][] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

const mixColor = (t: number): [number, number, number] => {
  const x = Math.min(0.999, Math.max(0, t)) * 2;
  const i = Math.floor(x);
  const f = x - i;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
};
const rgba = (c: [number, number, number], a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

interface Pulse {
  i: number;
  j: number;
  dir: number;
  t: number;
  run: number;
  speed: number;
  c: number;
}

/* Living circuit grid: light pulses race along the grid lines, the lattice lights up
   around the cursor, and a click sends a ripple through the grid. Only cheap 2D canvas
   work, and it stops completely while the hero is off-screen. */
export default function HeroGrid({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const startRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    activeRef.current = active;
    if (active) startRef.current?.();
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let last = performance.now();
    let pulses: Pulse[] = [];
    const ripples: { x: number; y: number; r: number }[] = [];
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let seen = false;
    let inten = 0;
    let tInten = 0;

    const spawn = (): Pulse => ({
      i: Math.floor(Math.random() * cols),
      j: Math.floor(Math.random() * rows),
      dir: Math.floor(Math.random() * 4),
      t: Math.random(),
      run: 0,
      speed: 0.9 + Math.random() * 1.3,
      c: Math.random(),
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isLite() ? 1 : 1.5);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL) + 1;
      rows = Math.ceil(H / CELL) + 1;
      const n = Math.min(isLite() ? 14 : 26, Math.round((W * H) / 70000) + 6);
      pulses = Array.from({ length: n }, spawn);
    };

    const drawHalo = () => {
      const R = 250;
      const i0 = Math.max(0, Math.floor((cx - R) / CELL));
      const i1 = Math.min(cols, Math.ceil((cx + R) / CELL));
      const j0 = Math.max(0, Math.floor((cy - R) / CELL));
      const j1 = Math.min(rows, Math.ceil((cy + R) / CELL));
      ctx.lineWidth = 1;
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const x = i * CELL + 0.5;
          const y = j * CELL + 0.5;
          const k = 1 - Math.hypot(x - cx, y - cy) / R;
          if (k <= 0) continue;
          const c = mixColor(x / W);
          const kr = 1 - Math.hypot(x + CELL - cx, y - cy) / R;
          if (kr > 0) {
            ctx.strokeStyle = rgba(c, 0.38 * Math.min(k, kr) * inten);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + CELL, y);
            ctx.stroke();
          }
          const kd = 1 - Math.hypot(x - cx, y + CELL - cy) / R;
          if (kd > 0) {
            ctx.strokeStyle = rgba(c, 0.38 * Math.min(k, kd) * inten);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + CELL);
            ctx.stroke();
          }
          const kk = k * k * inten;
          ctx.fillStyle = rgba(c, 0.25 + 0.7 * kk);
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + 3.4 * kk, 0, 6.2832);
          ctx.fill();
        }
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      const sc = mixColor(cx / W);
      g.addColorStop(0, rgba(sc, 0.1 * inten));
      g.addColorStop(1, rgba(sc, 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    };

    const drawRipples = (dt: number) => {
      const B = 46;
      const MAX = 1300;
      for (let n = ripples.length - 1; n >= 0; n--) {
        const rp = ripples[n];
        rp.r += 560 * dt;
        if (rp.r > MAX) {
          ripples.splice(n, 1);
          continue;
        }
        const fade = 1 - rp.r / MAX;
        const c = mixColor(rp.x / W);
        ctx.strokeStyle = rgba(c, 0.35 * fade);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, 6.2832);
        ctx.stroke();
        const i0 = Math.max(0, Math.floor((rp.x - rp.r - B) / CELL));
        const i1 = Math.min(cols, Math.ceil((rp.x + rp.r + B) / CELL));
        const j0 = Math.max(0, Math.floor((rp.y - rp.r - B) / CELL));
        const j1 = Math.min(rows, Math.ceil((rp.y + rp.r + B) / CELL));
        for (let i = i0; i <= i1; i++) {
          for (let j = j0; j <= j1; j++) {
            const x = i * CELL + 0.5;
            const y = j * CELL + 0.5;
            const k = 1 - Math.abs(Math.hypot(x - rp.x, y - rp.y) - rp.r) / B;
            if (k <= 0) continue;
            ctx.fillStyle = rgba(mixColor(x / W), 0.85 * k * fade);
            ctx.beginPath();
            ctx.arc(x, y, 1.5 + 3.5 * k, 0, 6.2832);
            ctx.fill();
          }
        }
      }
    };

    const drawPulses = (dt: number) => {
      for (const p of pulses) {
        p.t += p.speed * dt;
        while (p.t >= 1) {
          p.t -= 1;
          p.i += DIRS[p.dir][0];
          p.j += DIRS[p.dir][1];
          p.run += 1;
          if (p.i < 0 || p.j < 0 || p.i > cols || p.j > rows) {
            Object.assign(p, spawn(), { t: 0 });
            break;
          }
          const r = Math.random();
          if (r < 0.4) {
            p.dir = (p.dir + (r < 0.2 ? 1 : 3)) % 4;
            p.run = 0;
          }
        }
        const dx = DIRS[p.dir][0];
        const dy = DIRS[p.dir][1];
        const x = (p.i + dx * p.t) * CELL + 0.5;
        const y = (p.j + dy * p.t) * CELL + 0.5;
        const tl = Math.min(90, (p.run + p.t) * CELL);
        const c = mixColor(p.c);
        const g = ctx.createLinearGradient(x - dx * tl, y - dy * tl, x, y);
        g.addColorStop(0, rgba(c, 0));
        g.addColorStop(1, rgba(c, 0.85));
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x - dx * tl, y - dy * tl);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = rgba(c, 0.18);
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = rgba(c, 1);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 6.2832);
        ctx.fill();
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!activeRef.current || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, W, H);
      cx += (tx - cx) * Math.min(1, dt * 10);
      cy += (ty - cy) * Math.min(1, dt * 10);
      inten += (tInten - inten) * Math.min(1, dt * 6);
      if (inten > 0.02) drawHalo();
      drawRipples(dt);
      drawPulses(dt);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || reduce) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    startRef.current = start;

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const p = local(e);
      tInten = p.inside ? 1 : 0;
      if (!p.inside) return;
      tx = p.x;
      ty = p.y;
      if (!seen) {
        cx = tx;
        cy = ty;
        seen = true;
      }
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      if (p.inside && ripples.length < 4) ripples.push({ x: p.x, y: p.y, r: 0 });
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) tInten = 0;
    };
    const onVisible = () => {
      if (!document.hidden && activeRef.current) start();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("mouseout", onOut);
    document.addEventListener("visibilitychange", onVisible);
    if (activeRef.current) start();

    return () => {
      cancelAnimationFrame(raf);
      startRef.current = null;
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <canvas ref={ref} className="hv-grid-canvas" aria-hidden="true" />;
}