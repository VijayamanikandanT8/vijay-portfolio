import { useEffect, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { glideTo } from "../lib/glide";

const IDS = ["home", "about", "skills", "projects", "experience", "education", "certifications", "achievements", "services", "contact"];
const FX_W = 90; // spark canvas width (px)

// colour pair per section (same palette as the cursor)
const COLORS: [string, string][] = [
  ["#5fd8ff", "#8b7bff"], // home
  ["#ffb454", "#ff5fae"], // about
  ["#8b7bff", "#5fd8ff"], // skills
  ["#22d3ee", "#f472b6"], // projects
  ["#2dd4bf", "#5fa8ff"], // experience
  ["#5fa8ff", "#8b7bff"], // education
  ["#3ddc97", "#5fd8ff"], // certifications
  ["#ffb454", "#ff3a5f"], // achievements
  ["#ff3a5f", "#ffb454"], // services
  ["#3ddc97", "#8b7bff"], // contact
];
const NAMES = ["Home", "About", "Skills", "Projects", "Experience", "Education", "Certifications", "Achievements", "Services", "Contact"];
const hexRGB = (h: string) => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function scrollToY(y: number, immediate: boolean) {
  const lenis = window.__lenis;
  if (lenis) {
    if (immediate) lenis.scrollTo(y, { immediate: true, force: true });
    else void glideTo(y);
  } else {
    window.scrollTo({ top: y, behavior: immediate ? "instant" : "smooth" });
  }
}

type Spark = { x: number; y: number; vx: number; vy: number; life: number; decay: number; r: number };

/* Plasma Spine: spring-physics liquid thumb, dock-style notches, sparks. No labels. */
export default function ScrollRail() {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const spectrumInRef = useRef<HTMLDivElement>(null);
  const pctNameRef = useRef<HTMLElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const gooMainRef = useRef<HTMLSpanElement>(null);
  const drop1Ref = useRef<HTMLSpanElement>(null);
  const drop2Ref = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLDivElement>(null);
  const pctTxtRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current!;
    const rail = railRef.current!;
    const fill = fillRef.current!;
    const spectrum = spectrumRef.current!;
    const specIn = spectrumInRef.current!;
    const pctName = pctNameRef.current!;
    const thumb = thumbRef.current!;
    const gooMain = gooMainRef.current!;
    const d1 = drop1Ref.current!;
    const d2 = drop2Ref.current!;
    const pct = pctRef.current!;
    const pctTxt = pctTxtRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const RAIL_TOP = 10;
    let max = 1;
    let railH = 1;
    let thumbH = 48;
    let pos: number[] = IDS.map(() => 0);
    let tickY: number[] = IDS.map(() => 0);
    const fish: number[] = IDS.map(() => 0);
    let active = -1;
    let sparkRGB = "190,232,255";

    // physics state
    let y = 0;
    let vy = 0;
    let o1 = 0;
    let o2 = 0;
    let sv = 0;
    let lastSY = window.scrollY;
    let lastT = 0;
    let lastPct = -1;
    let hoverY: number | null = null;
    let dragging = false;
    let grabOffset = 0;
    let running = false;
    let raf = 0;
    let idleTimer = 0;
    let dpr = 1;
    const sparks: Spark[] = [];

    const isLocked = () => /-lock\b/.test(document.body.className);

    /* ---------- sparks ---------- */
    const sizeCanvas = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = FX_W * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.height = `${window.innerHeight}px`;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const emitTrail = (cy: number, speed: number) => {
      const n = Math.min(3, Math.floor(Math.abs(speed) / 14) + 1);
      for (let i = 0; i < n && sparks.length < 140; i++) {
        sparks.push({
          x: FX_W - 6 + (Math.random() - 0.5) * 4,
          y: cy + (Math.random() - 0.5) * thumbH,
          vx: -(0.35 + Math.random() * 1.5),
          vy: -Math.sign(speed) * Math.random() * 0.9,
          life: 1,
          decay: 0.018 + Math.random() * 0.02,
          r: 0.6 + Math.random() * 1.5,
        });
      }
    };
    const emitBurst = (cy: number) => {
      for (let i = 0; i < 18 && sparks.length < 160; i++) {
        const ang = (Math.random() - 0.5) * Math.PI;
        const s = 1.1 + Math.random() * 2.2;
        sparks.push({
          x: FX_W - 3,
          y: cy,
          vx: -Math.cos(ang) * s,
          vy: Math.sin(ang) * s,
          life: 1,
          decay: 0.022 + Math.random() * 0.02,
          r: 0.8 + Math.random() * 1.6,
        });
      }
    };
    const drawSparks = (dt: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, FX_W, window.innerHeight);
      if (!sparks.length) return;
      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= 0.985;
        s.life -= s.decay * dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        const rr = s.r * (0.5 + s.life * 0.5);
        ctx.fillStyle = `rgba(${sparkRGB},${(s.life * 0.22).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rr * 2.6, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = `rgba(245,252,255,${(s.life * 0.95).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rr, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    /* ---------- section colours ---------- */
    const applyTheme = (i: number) => {
      const c = COLORS[i] ?? COLORS[0];
      root.style.setProperty("--sx-c1", c[0]);
      root.style.setProperty("--sx-c2", c[1]);
      sparkRGB = hexRGB(c[0]);
      pctName.textContent = NAMES[i] ?? "";
    };

    /* ---------- active section ---------- */
    const setActive = (i: number) => {
      if (i === active) return;
      const first = active === -1;
      active = i;
      applyTheme(i);
      tickRefs.current.forEach((t, k) => {
        if (!t) return;
        t.classList.toggle("is-active", k === i);
        t.classList.toggle("is-passed", k < i);
      });
      const t = tickRefs.current[i];
      if (t && !first) {
        t.classList.remove("is-ping");
        void t.offsetWidth;
        t.classList.add("is-ping");
        if (!reduce && !isLocked() && !document.documentElement.classList.contains("is-navigating")) emitBurst(RAIL_TOP + tickY[i]);
      }
    };

    /* ---------- main loop ---------- */
    const tick = (now: number) => {
      const dt = Math.min(2.5, (now - lastT) / 16.667 || 1);
      lastT = now;

      const sy = window.scrollY;
      const p = clamp(sy / max, 0, 1);
      const travel = Math.max(1, railH - thumbH);
      const target = p * travel;
      sv += (sy - lastSY - sv) * 0.2;
      lastSY = sy;

      // spring (slightly underdamped -> elastic overshoot)
      if (reduce) {
        y = target;
        vy = 0;
      } else {
        vy += ((target - y) * 0.2 - vy * 0.4) * dt;
        y += vy * dt;
      }

      // liquid droplets are pushed backwards by velocity
      const ve = vy + sv * 0.04;
      const t1 = reduce ? 0 : clamp(-ve * 9, -64, 64);
      const t2 = reduce ? 0 : clamp(-ve * 17, -78, 78);
      o1 += (t1 - o1) * 0.18 * dt;
      o2 += (t2 - o2) * 0.12 * dt;

      const stretch = 1 + clamp(Math.abs(ve) * 0.06, 0, 0.35);
      const squeeze = 1 / Math.sqrt(stretch);
      const tf = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${squeeze.toFixed(3)}, ${stretch.toFixed(3)})`;
      thumb.style.transform = tf;
      gooMain.style.transform = tf;

      const yc = y + thumbH / 2;
      const s1 = clamp(1 - Math.abs(o1) / 110, 0.45, 1);
      const s2 = clamp(1 - Math.abs(o2) / 110, 0.4, 1);
      d1.style.transform = `translate3d(${(-Math.abs(ve) * 0.6).toFixed(2)}px, ${(yc + o1 - 3.5).toFixed(2)}px, 0) scale(${s1.toFixed(3)})`;
      d2.style.transform = `translate3d(${(-Math.abs(ve) * 1.1).toFixed(2)}px, ${(yc + o2 - 3.5).toFixed(2)}px, 0) scale(${s2.toFixed(3)})`;

      fill.style.transform = `scaleY(${(yc / railH).toFixed(4)})`;
      // reveal with two opposite transforms (compositor only, no repaint per frame)
      const reveal = clamp(yc, 0, railH);
      spectrum.style.transform = `translate3d(0, ${(reveal - railH).toFixed(1)}px, 0)`;
      specIn.style.transform = `translate3d(0, ${(railH - reveal).toFixed(1)}px, 0)`;
      pct.style.transform = `translate3d(0, ${(yc - 13).toFixed(1)}px, 0)`;

      const pc = Math.round(p * 100);
      if (pc !== lastPct) {
        lastPct = pc;
        pctTxt.textContent = String(pc).padStart(2, "0");
        thumb.setAttribute("aria-valuenow", String(pc));
      }
      root.style.setProperty("--sx-speed", clamp(Math.abs(sv) / 45, 0, 1).toFixed(2));

      // dock-style swelling of the notches near the thumb / pointer
      let fBusy = false;
      for (let i = 0; i < tickY.length; i++) {
        const dT = Math.abs(tickY[i] - yc);
        const fT = Math.exp(-Math.pow(dT / 52, 2)) * 0.6;
        const fH = hoverY === null ? 0 : Math.exp(-Math.pow((tickY[i] - hoverY) / 38, 2));
        const tg = Math.max(fT, fH);
        fish[i] += (tg - fish[i]) * 0.22 * dt;
        if (Math.abs(tg - fish[i]) > 0.004) fBusy = true;
        const t = tickRefs.current[i];
        if (t) t.style.setProperty("--f", fish[i].toFixed(3));
      }

      // active section
      let idx = 0;
      const probe = sy + window.innerHeight * 0.4;
      for (let i = 0; i < pos.length; i++) if (pos[i] <= probe) idx = i;
      if (max - sy < 6) idx = pos.length - 1;
      setActive(idx);

      // sparks
      if (!reduce && !isLocked() && !document.documentElement.classList.contains("is-navigating") && Math.abs(sv) > 4) emitTrail(RAIL_TOP + yc, sv);
      if (!reduce) drawSparks(dt);

      const busy =
        Math.abs(target - y) > 0.05 ||
        Math.abs(vy) > 0.03 ||
        Math.abs(sv) > 0.3 ||
        Math.abs(o1) > 0.1 ||
        Math.abs(o2) > 0.1 ||
        fBusy ||
        sparks.length > 0 ||
        dragging;

      if (busy) raf = requestAnimationFrame(tick);
      else {
        running = false;
        sv = 0;
        root.style.setProperty("--sx-speed", "0");
      }
    };

    const kick = () => {
      if (running) return;
      running = true;
      lastT = performance.now();
      raf = requestAnimationFrame(tick);
    };

    /* ---------- measuring ---------- */
    const measure = () => {
      if (isLocked()) return;
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      railH = rail.clientHeight || 1;
      thumbH = clamp((window.innerHeight / (max + window.innerHeight)) * railH, 40, 120);
      root.style.setProperty("--sx-th", `${thumbH}px`);

      pos = IDS.map((id, i) => {
        if (i === 0) return 0;
        const pin = ScrollTrigger.getById(`${id}-pin`);
        let yy: number;
        if (pin) yy = pin.start;
        else {
          const c = id === "certifications" ? ScrollTrigger.getById("certifications-scroll") : undefined;
          if (c) yy = c.start;
          else {
            const el = document.getElementById(id);
            yy = el ? el.getBoundingClientRect().top + window.scrollY : 0;
          }
        }
        return clamp(yy, 0, max);
      });
      for (let i = 1; i < pos.length; i++) pos[i] = Math.max(pos[i], pos[i - 1]);

      tickY = pos.map((yy) => thumbH / 2 + (yy / max) * (railH - thumbH));
      // the rail's colour flows from section to section, exactly at each notch
      specIn.style.background = `linear-gradient(180deg, ${tickY
        .map((ty, i) => `${COLORS[i][0]} ${ty.toFixed(1)}px`)
        .join(", ")})`;
      tickY.forEach((ty, i) => {
        const t = tickRefs.current[i];
        if (t) {
          t.style.top = `${ty.toFixed(1)}px`;
          t.style.setProperty("--tc", COLORS[i][0]);
        }
      });
      sizeCanvas();
      kick();
    };

    const wake = () => {
      root.classList.add("is-awake");
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => root.classList.remove("is-awake"), 1600);
    };
    const onScroll = () => {
      wake();
      kick();
    };

    /* ---------- pointer: drag / jump / dock hover ---------- */
    const seek = (clientY: number) => {
      const r = rail.getBoundingClientRect();
      const ratio = clamp((clientY - r.top - grabOffset) / Math.max(1, r.height - thumbH), 0, 1);
      scrollToY(ratio * max, true);
    };
    const onDown = (e: PointerEvent) => {
      if (isLocked()) return;
      // click a notch -> glide straight to that section
      const rr = rail.getBoundingClientRect();
      const hit = tickY.findIndex((ty) => Math.abs(ty - (e.clientY - rr.top)) < 12);
      if (hit > -1) {
        scrollToY(pos[hit], false);
        e.preventDefault();
        kick();
        return;
      }
      const tr = thumb.getBoundingClientRect();
      const onThumb = e.clientY >= tr.top && e.clientY <= tr.bottom;
      grabOffset = onThumb ? e.clientY - tr.top : thumbH / 2;
      dragging = true;
      root.classList.add("is-dragging");
      rail.setPointerCapture(e.pointerId);
      seek(e.clientY);
      kick();
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      hoverY = e.clientY - rail.getBoundingClientRect().top;
      if (dragging) seek(e.clientY);
      kick();
    };
    const onLeave = () => {
      if (dragging) return;
      hoverY = null;
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      root.classList.remove("is-dragging");
      if (rail.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
      if (e.pointerType !== "mouse") hoverY = null;
      kick();
    };
    rail.addEventListener("pointerdown", onDown);
    rail.addEventListener("pointermove", onMove);
    rail.addEventListener("pointerleave", onLeave);
    rail.addEventListener("pointerup", onUp);
    rail.addEventListener("pointercancel", onUp);

    const syncLock = () => {
      root.classList.toggle("is-locked", isLocked());
      if (!isLocked()) measure();
    };
    const mo = new MutationObserver(syncLock);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    let mTimer = 0;
    const remeasure = () => {
      window.clearTimeout(mTimer);
      mTimer = window.setTimeout(measure, 120);
    };
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    ScrollTrigger.addEventListener("refresh", remeasure);
    window.addEventListener("resize", remeasure);
    window.addEventListener("load", remeasure);
    window.addEventListener("scroll", onScroll, { passive: true });
    const warm = [300, 1200, 3000].map((t) => window.setTimeout(measure, t));

    measure();
    // start the thumb exactly where the page is (no fly-in)
    y = clamp(window.scrollY / max, 0, 1) * Math.max(1, railH - thumbH);
    wake();
    requestAnimationFrame(() => root.classList.add("is-ready"));

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      window.clearTimeout(mTimer);
      warm.forEach((t) => window.clearTimeout(t));
      mo.disconnect();
      ro.disconnect();
      ScrollTrigger.removeEventListener("refresh", remeasure);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("load", remeasure);
      window.removeEventListener("scroll", onScroll);
      rail.removeEventListener("pointerdown", onDown);
      rail.removeEventListener("pointermove", onMove);
      rail.removeEventListener("pointerleave", onLeave);
      rail.removeEventListener("pointerup", onUp);
      rail.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onKey = (e: ReactKeyboardEvent) => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const map: Record<string, number> = {
      ArrowDown: y + 120,
      ArrowUp: y - 120,
      PageDown: y + vh * 0.9,
      PageUp: y - vh * 0.9,
      Home: 0,
      End: document.documentElement.scrollHeight,
    };
    if (e.key in map) {
      e.preventDefault();
      scrollToY(Math.max(0, map[e.key]), false);
    }
  };

  return (
    <div className="sx-root" ref={rootRef}>
      <svg className="sx-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="sx-goo" x="-60%" y="-10%" width="220%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
            <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
          </filter>
        </defs>
      </svg>

      <canvas className="sx-fx" ref={canvasRef} width={FX_W} aria-hidden="true" />

      <div className="sx-rail" ref={railRef}>
        <div className="sx-track" aria-hidden="true" />
        <div className="sx-fill" ref={fillRef} aria-hidden="true" />
        <div className="sx-spectrum" ref={spectrumRef} aria-hidden="true">
          <div className="sx-spectrum__in" ref={spectrumInRef} />
        </div>
        {IDS.map((id, i) => (
          <span
            key={id}
            className="sx-tick"
            data-label={`${String(i).padStart(2, "0")} · ${NAMES[i]}`}
            aria-hidden="true"
            ref={(el) => {
              tickRefs.current[i] = el;
            }}
          />
        ))}

        <div className="sx-goo" aria-hidden="true">
          <span className="sx-goo-main" ref={gooMainRef} />
          <span className="sx-drop" ref={drop1Ref} />
          <span className="sx-drop" ref={drop2Ref} />
        </div>

        <div className="sx-thumb" ref={thumbRef} role="scrollbar" aria-orientation="vertical" aria-label="Page scroll" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} tabIndex={0} onKeyDown={onKey}>
          <span className="sx-thumb-halo" />
          <span className="sx-thumb-body" />
          <span className="sx-thumb-grip" />
        </div>

        <div className="sx-pct" ref={pctRef} aria-hidden="true">
          <span ref={pctTxtRef}>00</span>
          <em>%</em>
          <b className="sx-pct-name" ref={pctNameRef} />
        </div>
      </div>
    </div>
  );
}