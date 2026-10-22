import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ParticleField from "./ParticleField";
const AboutCore = lazy(() => import("./AboutCore"));
import { glideTo } from "../lib/glide";
import type { AboutEnergy } from "./AboutCore";
import type { SiteData } from "../types/site";
import { Icon } from "../content/icons";
import "./Aboutsection.css";

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// EDIT THESE to change the copy that is not coming from your backend.
// ---------------------------------------------------------------------------
const INTRO_LINE = "Building practical software, from a blank file to something people use every day.";

const CHAPTER_NAMES = ["Intro", "Story", "Journey", "Drive"];

const STAT_META = [
  { icon: Icon.code, accent: "#5fd8ff", fill: 0.38 },
  { icon: Icon.rocket, accent: "#8b7bff", fill: 0.72 },
  { icon: Icon.cup, accent: "#ff5fae", fill: 1 },
  { icon: Icon.infinity, accent: "#ffb454", fill: 0.86 },
];

const DEFAULT_STATS = [
  { value: 2, suffix: "+", label: "Years Learning & Building" },
  { value: 30, suffix: "+", label: "Projects Completed" },
  { value: 100, suffix: "%", label: "Passion For Coding" },
  { value: 0, suffix: "\u221E", label: "Continuous Improvement" },
];

const JOURNEY = [
  { year: "2019", title: "B.E CSE", note: "Started the journey" },
  { year: "2023", title: "Web Development", note: "Discovered my passion" },
  { year: "2025", title: "Python Developer", note: "Building the future" },
];

const DRIVES = [
  { icon: Icon.puzzle, label: "Problem Solving", note: "Break it down, then ship it." },
  { icon: Icon.code, label: "Clean Code", note: "Readable beats clever." },
  { icon: Icon.book, label: "Learning", note: "A little more, every day." },
  { icon: Icon.bulb, label: "Innovation", note: "Ideas into working things." },
];

const FALLBACK_CHIPS = ["Python", "Django", "FastAPI", "Flutter", "AI/ML", "React", "SQL", "Docker"];

const HIGHLIGHT_COLORS: Record<string, string> = {
  Django: "var(--violet)",
  FastAPI: "var(--magenta)",
  Flutter: "var(--sky)",
  "AI/ML": "var(--magenta)",
  PDF: "var(--cyan)",
  Word: "var(--violet)",
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const STOPS = [
  [95, 216, 255],
  [139, 123, 255],
  [255, 95, 174],
];
const gradAt = (t: number) => {
  const s = Math.min(Math.max(t, 0), 1) * (STOPS.length - 1);
  const i = Math.min(Math.floor(s), STOPS.length - 2);
  const f = s - i;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",")})`;
};

const GLYPHS = "!<>-_\\/[]{}=+*^?#";
function scramble(el: HTMLElement, text: string, duration = 0.9) {
  const o = { p: 0 };
  return gsap.to(o, {
    p: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      const n = Math.floor(o.p * text.length);
      el.textContent =
        text.slice(0, n) +
        Array.from(text.slice(n), (c) => (c === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
    },
    onComplete: () => {
      el.textContent = text;
    },
  });
}

function Chars({ text, offset, total }: { text: string; offset: number; total: number }) {
  return (
    <span className="ab-title__chars">
      {text.split("").map((c, i) => (
        <span className="ab-c" key={i} style={{ color: gradAt((offset + i) / (total - 1)) }}>
          {c}
        </span>
      ))}
    </span>
  );
}

function Words({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\s+/)
        .filter(Boolean)
        .map((w, i) => {
          const key = w.replace(/^[^\w/]+|[^\w/]+$/g, "");
          const hl = HIGHLIGHT_COLORS[key];
          return (
            <span key={i}>
              <span
                className={"ab-w" + (hl ? " ab-w--hl" : "")}
                style={hl ? ({ ["--hl" as string]: hl } as CSSProperties) : undefined}
              >
                {w}
              </span>{" "}
            </span>
          );
        })}
    </>
  );
}

// card tilt + cursor spotlight
function tiltify(el: HTMLElement, inner: HTMLElement, max = 9) {
  const rx = gsap.quickTo(inner, "rotationX", { duration: 0.5, ease: "power3" });
  const ry = gsap.quickTo(inner, "rotationY", { duration: 0.5, ease: "power3" });
  gsap.set(inner, { transformPerspective: 700 });
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry((px - 0.5) * 2 * max);
    rx(-(py - 0.5) * 2 * max);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const leave = () => {
    rx(0);
    ry(0);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", leave);
  return () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", leave);
  };
}

const PATH_D = "M 20 340 C 250 340, 330 170, 600 235 S 950 330, 1180 150";
const NODE_P = [0.07, 0.5, 0.93];
const RING_C = 2 * Math.PI * 26;

export default function AboutSection({ data }: { data: SiteData }) {
  const rootRef = useRef<HTMLElement>(null);
  const energy = useRef<AboutEnergy>({ speed: 1, vel: 0 }).current;
  const about = data?.about;
  const site = data?.site;

  const [stack, setStack] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 860px), (prefers-reduced-motion: reduce)").matches,
  );

  // Re-evaluate when the viewport crosses the breakpoint (rotate, DevTools toggle, resize)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px), (prefers-reduced-motion: reduce)");
    const onChange = () => setStack(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const eyebrowText = about?.eyebrow || "Get To Know Me";
  const paragraphs =
    about?.paragraphs && about.paragraphs.length > 0
      ? about.paragraphs
      : [
          "I'm Vijayamanikandan T., a Python fullstack developer who likes taking a project from a blank file to something people actually use. My time splits between backend APIs in Django and FastAPI, mobile apps in Flutter, and AI/ML pipelines that turn raw data into something useful.",
          "Outside client work, I build the unglamorous tools that save people hours \u2014 PDF and Word automation, adaptive e-learning systems, and teaching material for AI/ML classes. I'd rather ship something small and working than something big and stuck in planning.",
        ];
  const quoteText = about?.quote || "Code is not just what I write, it's how I bring ideas to life.";
  const fullName = site?.name || "Vijayamanikandan T";
  const shortName = site?.nickname || "Vijay";
  const roleLabel = site?.roleHighlight || site?.heroTag || "Python Developer";
  const chips = (data?.techStack?.length ? data.techStack.map((t) => t.label) : FALLBACK_CHIPS).slice(0, 8);
  const rawStats = about?.stats && about.stats.length > 0 ? about.stats.slice(0, 4) : DEFAULT_STATS;
  const stats = rawStats.map((s: any) => {
    const raw = s.value ?? s.count ?? s.number ?? s.amount ?? s.stat ?? 0;
    const value = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    return { value: Number.isFinite(value) ? value : 0, suffix: s.suffix ?? "", label: s.label ?? "" };
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const cleanups: Array<() => void> = [];
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
    const $$ = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);

    const ctx = gsap.context(() => {
      // ------------------------------------------------------------------
      // Phones / reduced motion: no pin, simple reveals
      // ------------------------------------------------------------------
      if (stack) {
        if (reduce) return;
        $$(".ab-ch").forEach((c) => {
          gsap.from(c.querySelectorAll("[data-reveal]"), {
            autoAlpha: 0,
            y: 40,
            duration: 1.4,
            ease: "power3.out",
            stagger: 0.18,
            scrollTrigger: { trigger: c, start: "top 82%", once: true },
          });
        });
        return;
      }

      // ------------------------------------------------------------------
      // Desktop: one pinned scene, four chapters
      // ------------------------------------------------------------------
      const [c1, c2, c3, c4] = $$(".ab-ch");
      const corePos = $(".ab-core-pos");
      const core = $(".ab-core");
      const tilt = $(".ab-core__tilt");
      const dial = $(".ab-dial");
      const scan = $(".ab-scan");
      const cursor = $(".ab-cursor");
      const aurora = $(".ab-bg");
      const hudCh = $(".ab-hud__ch");
      const hudPct = $(".ab-hud__pct");
      const railFill = $(".ab-rail__fill");
      const railItems = $$(".ab-rail__item");
      const tickerTrack = $(".ab-ticker__track");

      // ---- initial states -------------------------------------------------
      const introEls = $$("[data-intro]");
      const titleChars = $$(".ab-title .ab-c");
      const nameEl = $(".ab-title__name");
      gsap.set([c2, c3, c4], { autoAlpha: 0 });
      gsap.set(corePos, { autoAlpha: 0, scale: 0.6 });
      gsap.set(introEls, { autoAlpha: 0, y: 30 });
      gsap.set(titleChars, { autoAlpha: 0, yPercent: 120, rotateX: -90 });
      gsap.set(nameEl, { autoAlpha: 0, x: -24, rotate: -12 });

      // ---- time based intro (plays as the section arrives) -----------------
      const badgeT = $(".ab-badge__t");
      const roleT = $(".ab-role__t");
      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: root, start: "top 78%", once: true },
        })
        .to(corePos, { autoAlpha: 1, scale: 1, duration: 1.6, ease: "expo.out" }, 0)
        .to($("[data-intro].ab-badge"), { autoAlpha: 1, y: 0, duration: 0.6 }, 0.1)
        .add(() => void scramble(badgeT, eyebrowText, 0.9), 0.15)
        .to(titleChars, { autoAlpha: 1, yPercent: 0, rotateX: 0, duration: 0.9, ease: "back.out(1.6)", stagger: 0.06 }, 0.25)
        .to(nameEl, { autoAlpha: 1, x: 0, rotate: -4, duration: 0.7, ease: "back.out(1.8)" }, 0.85)
        .to($("[data-intro].ab-role"), { autoAlpha: 1, y: 0, duration: 0.6 }, 1.0)
        .add(() => void scramble(roleT, roleLabel, 0.9), 1.05)
        .to($("[data-intro].ab-lead"), { autoAlpha: 1, y: 0, duration: 0.7 }, 1.15)
        .to($("[data-intro].ab-actions"), { autoAlpha: 1, y: 0, duration: 0.7 }, 1.3);

      // ---- shared scrub timeline ----------------------------------------------
      const T = { x1: 0.8, x2: 3.3, x3: 6.0, end: 9.3 };
      const orbit = energy;
      let active = -1;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "about-pin",
          trigger: root,
          start: "top top",
          end: "+=1000%",
          pin: true,
          anticipatePin: 1,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const t = tl.time();
            const idx = t < T.x1 + 0.35 ? 0 : t < T.x2 + 0.35 ? 1 : t < T.x3 + 0.35 ? 2 : 3;
            if (idx !== active) {
              active = idx;
              railItems.forEach((el, i) => el.classList.toggle("is-active", i === idx));
              scramble(hudCh, `CH 0${idx + 1} / 04 \u2014 ${CHAPTER_NAMES[idx].toUpperCase()}`, 0.5);
            }
            railFill.style.transform = `scaleY(${self.progress})`;
            hudPct.textContent = `${String(Math.round(self.progress * 100)).padStart(3, "0")}%`;
          },
        },
      });
      const st = tl.scrollTrigger!;

      // chapter hand-off: old one blurs out, new one blurs in, a scan beam sweeps
      const swap = (from: HTMLElement, to: HTMLElement, at: number) => {
        // explicit start values + immediateRender:false keep a scrubbed,
        // rewound timeline deterministic (no start values read from a
        // half-played state).
        tl.fromTo(
          from,
          { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)" },
          { autoAlpha: 0, y: -40, scale: 1.03, filter: "blur(14px)", duration: 0.45, ease: "power2.in", immediateRender: false },
          at,
        )
          .fromTo(
            to,
            { autoAlpha: 0, y: 50, scale: 0.97, filter: "blur(14px)" },
            { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out", immediateRender: false },
            at + 0.25,
          )
          .fromTo(
            scan,
            { autoAlpha: 1, y: -160 },
            { autoAlpha: 1, y: () => window.innerHeight + 20, duration: 0.7, ease: "power1.inOut", immediateRender: false },
            at,
          )
          .set(scan, { autoAlpha: 0 }, at + 0.7);
      };
      swap(c1, c2, T.x1);
      swap(c2, c3, T.x2);
      swap(c3, c4, T.x3);

      // the orbit core travels between chapters
      const hold = { immediateRender: false, duration: 0.7, ease: "power2.inOut" } as const;
      tl.fromTo(core, { x: "0vw", y: "0vh", scale: 1, opacity: 1 }, { x: "11vw", y: "-34vh", scale: 0.46, opacity: 1, ...hold }, T.x1)
        .fromTo(core, { x: "11vw", y: "-34vh", scale: 0.46, opacity: 1 }, { x: "-6vw", y: "2vh", scale: 1.9, opacity: 0.22, ...hold }, T.x2)
        .fromTo(core, { x: "-6vw", y: "2vh", scale: 1.9, opacity: 0.22 }, { x: "-2vw", y: "-4vh", scale: 1.25, opacity: 0.34, ...hold }, T.x3)
        .fromTo(orbit, { speed: 1 }, { speed: 2.4, ...hold }, T.x1)
        .fromTo(orbit, { speed: 2.4 }, { speed: 0.7, ...hold }, T.x2)
        .fromTo(orbit, { speed: 0.7 }, { speed: 1.4, ...hold }, T.x3)
        .fromTo(dial, { rotation: 0 }, { rotation: 200, duration: T.end, immediateRender: false }, 0);

      // ---- chapter 2: story ------------------------------------------------------
      tl.fromTo(
        $$(".ab-ch--story .ab-w"),
        { opacity: 0.14 },
        { opacity: 1, stagger: { amount: 1.0 }, duration: 0.2 },
        1.75,
      );
      const statEls = $$(".ab-stat");
      tl.fromTo(
        statEls,
        { autoAlpha: 0, y: 70, rotateX: -45, transformPerspective: 900, transformOrigin: "50% 100%" },
        { autoAlpha: 1, y: 0, rotateX: 0, stagger: 0.14, duration: 0.6, ease: "power3.out" },
        1.7,
      );
      statEls.forEach((el, i) => {
        const numEl = el.querySelector<HTMLElement>(".ab-stat__num")!;
        const arc = el.querySelector<SVGCircleElement>(".ab-stat__arc")!;
        const target = Number(el.dataset.value ?? 0);
        const suffix = el.dataset.suffix ?? "";
        const fill = STAT_META[i % STAT_META.length].fill;
        const o = { v: 0 };
        gsap.set(arc, { strokeDasharray: RING_C, strokeDashoffset: RING_C });
        if (suffix !== "\u221E") numEl.textContent = `0${suffix}`;
        tl.to(
          o,
          {
            v: target,
            duration: 0.9,
            ease: "power2.out",
            onUpdate: () => {
              if (suffix !== "\u221E") numEl.textContent = `${Math.round(o.v)}${suffix}`;
            },
          },
          1.95 + i * 0.14,
        ).to(arc, { strokeDashoffset: RING_C * (1 - fill), duration: 0.9, ease: "power2.out" }, 1.95 + i * 0.14);
      });

      // ---- chapter 3: journey ------------------------------------------------------
      const path = $<HTMLElement>(".ab-jpath__line") as unknown as SVGPathElement;
      const L = path.getTotalLength();
      gsap.set(path, { strokeDasharray: L, strokeDashoffset: L });
      const track = $(".ab-jtrack");
      const comet = $(".ab-comet");
      const nodes = $$(".ab-jnode");
      const yearEls = $$(".ab-jcard__year");
      const place = () => {
        const w = track.clientWidth;
        const h = track.clientHeight;
        nodes.forEach((n, i) => {
          const pt = path.getPointAtLength(L * NODE_P[i]);
          n.style.left = `${(pt.x / 1200) * w}px`;
          n.style.top = `${(pt.y / 420) * h}px`;
        });
      };
      place();
      ScrollTrigger.addEventListener("refresh", place);
      cleanups.push(() => ScrollTrigger.removeEventListener("refresh", place));

      tl.fromTo($$(".ab-jhead > *"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" }, 4.0)
        .fromTo(comet, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 4.25);
      const prog = { p: 0 };
      tl.to(
        prog,
        {
          p: 1,
          duration: 1.3,
          ease: "none",
          onUpdate: () => {
            const w = track.clientWidth;
            const h = track.clientHeight;
            const pt = path.getPointAtLength(L * prog.p);
            comet.style.transform = `translate(${(pt.x / 1200) * w}px, ${(pt.y / 420) * h}px)`;
            path.style.strokeDashoffset = String(L * (1 - prog.p));
            nodes.forEach((n, i) => n.classList.toggle("is-on", prog.p >= NODE_P[i] - 0.015));
          },
        },
        4.3,
      );
      yearEls.forEach((el, i) => {
        el.textContent = JOURNEY[i].year;
      });

      // ---- chapter 4: drive + quote ---------------------------------------------------
      tl.fromTo($(".ab-dhead"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, 6.85)
        .fromTo(
          $$(".ab-drive"),
          { autoAlpha: 0, y: 80, rotateY: -60, z: -200, transformPerspective: 900 },
          { autoAlpha: 1, y: 0, rotateY: 0, z: 0, stagger: 0.12, duration: 0.6, ease: "back.out(1.4)" },
          6.95,
        )
        .fromTo(
          $$(".ab-ch--drive .ab-w"),
          { opacity: 0.12 },
          { opacity: 1, stagger: { amount: 0.8 }, duration: 0.2 },
          7.7,
        )
        .fromTo(
          $$(".ab-quote__side > *"),
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.5, ease: "power3.out" },
          8.2,
        )
        .to({}, { duration: 0.0001 }, T.end);

      // ---- bottom ticker: speeds up with scroll velocity ------------------------------
      const tickerTween = gsap.to(tickerTrack, { xPercent: -50, duration: 36, ease: "none", repeat: -1 });

      // ---- core energy + ticker react to scroll velocity ----------------------------------
      let visible = true;
      const onTick = () => {
        const v = Math.abs(st.getVelocity());
        orbit.vel = visible ? v : 0;
        tickerTween.timeScale(gsap.utils.interpolate(tickerTween.timeScale(), 1 + Math.min(v / 350, 7), 0.1));
      };
      gsap.ticker.add(onTick);
      cleanups.push(() => gsap.ticker.remove(onTick));
      const vis = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (visible = self.isActive),
      });
      cleanups.push(() => vis.kill());

      // ---- pointer effects --------------------------------------------------------------------
      if (!coarse) {
        const rxQ = gsap.quickTo(tilt, "rotationX", { duration: 0.9, ease: "power3" });
        const ryQ = gsap.quickTo(tilt, "rotationY", { duration: 0.9, ease: "power3" });
        gsap.set(tilt, { transformPerspective: 900 });
        const cx = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
        const cy = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });
        const ax = gsap.quickTo(aurora, "x", { duration: 1.2, ease: "power3" });
        const ay = gsap.quickTo(aurora, "y", { duration: 1.2, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          ryQ(nx * 22);
          rxQ(-ny * 16);
          cx(e.clientX - r.left);
          cy(e.clientY - r.top);
          ax(nx * -24);
          ay(ny * -18);
        };
        root.addEventListener("pointermove", onMove);
        cleanups.push(() => root.removeEventListener("pointermove", onMove));

        $$(".ab-stat").forEach((el) => cleanups.push(tiltify(el, el.querySelector<HTMLElement>(".ab-stat__in")!)));
        $$(".ab-drive").forEach((el) => cleanups.push(tiltify(el, el.querySelector<HTMLElement>(".ab-drive__in")!, 12)));
        $$(".ab-jcard").forEach((el) => cleanups.push(tiltify(el, el, 6)));

        // magnetic buttons
        $$(".ab-cta").forEach((btn) => {
          const inner = btn.querySelector<HTMLElement>(".ab-cta__in")!;
          const mx = gsap.quickTo(inner, "x", { duration: 0.5, ease: "power3" });
          const my = gsap.quickTo(inner, "y", { duration: 0.5, ease: "power3" });
          const move = (e: PointerEvent) => {
            const r = btn.getBoundingClientRect();
            mx((e.clientX - (r.left + r.width / 2)) * 0.28);
            my((e.clientY - (r.top + r.height / 2)) * 0.4);
          };
          const leave = () => {
            mx(0);
            my(0);
          };
          btn.addEventListener("pointermove", move as EventListener);
          btn.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            btn.removeEventListener("pointermove", move as EventListener);
            btn.removeEventListener("pointerleave", leave);
          });
        });
      }

      // ---- chapter rail: click to jump ------------------------------------------------------------
      const holds = [0.3, 2.6, 5.4, 8.4];
      railItems.forEach((el, i) => {
        const go = () => {
          const y = st.start + (holds[i] / tl.duration()) * (st.end - st.start);
          void glideTo(y);
        };
        el.addEventListener("click", go);
        cleanups.push(() => el.removeEventListener("click", go));
      });
      railItems[0].classList.add("is-active");
      cleanups.push(() => tickerTween.kill());
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready?.then(refresh).catch(() => {});
    const settle = window.setTimeout(refresh, 1200);

    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(settle);
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [stack, eyebrowText, roleLabel]);

  const tickerWords = [...chips, "Clean Code", "Automation", "E-Learning"];

  return (
    <section className={"ab" + (stack ? " ab--stack" : "")} id="about" ref={rootRef}>
      {/* ---------------- background ---------------- */}
      <div className="ab-bg" aria-hidden="true">
        <div className="ab-bg__img" />
      </div>
      <ParticleField className="ab-particles" density={50} speed={0.04} colorStops={["#8b7bff", "#5fd8ff", "#ff5fae"]} />
      <svg className="ab-dial" viewBox="-500 -500 1000 1000" aria-hidden="true">
        <circle r="480" className="ab-dial__ring" />
        <circle r="392" className="ab-dial__ring ab-dial__ring--dash" />
        {Array.from({ length: 120 }, (_, i) => {
          const long = i % 10 === 0;
          return (
            <line
              key={i}
              className={long ? "ab-dial__tick ab-dial__tick--long" : "ab-dial__tick"}
              x1="0"
              y1="-470"
              x2="0"
              y2={-(470 - (long ? 30 : 12))}
              transform={`rotate(${i * 3})`}
            />
          );
        })}
      </svg>
      <div className="ab-cursor" aria-hidden="true" />
      <div className="ab-grain" aria-hidden="true" />
      <div className="ab-scan" aria-hidden="true" />

      {/* ---------------- persistent orbit core ---------------- */}
      <div className="ab-core-pos" aria-hidden="true">
        <div className="ab-core">
          <div className="ab-core__tilt">
            <Suspense fallback={null}>
              <AboutCore energy={energy} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* ---------------- HUD ---------------- */}
      <div className="ab-hud" aria-hidden="true">
        <span>
          <b>SYS.PROFILE</b> // <span className="ab-hud__ch">CH 01 / 04 &mdash; INTRO</span>
        </span>
        <span className="ab-hud__pct">000%</span>
      </div>
      <nav className="ab-rail" aria-label="About chapters">
        <span className="ab-rail__line">
          <span className="ab-rail__fill" />
        </span>
        {CHAPTER_NAMES.map((n, i) => (
          <button type="button" className="ab-rail__item" key={n} aria-label={`Chapter ${i + 1}: ${n}`}>
            <span className="ab-rail__dot" />
            <span className="ab-rail__no">0{i + 1}</span>
          </button>
        ))}
      </nav>

      {/* ---------------- chapters ---------------- */}
      <div className="ab-stage">
        {/* 01 INTRO */}
        <div className="ab-ch ab-ch--intro">
          <span className="ab-badge" data-intro data-reveal>
            <i className="ab-badge__dot" />
            <span className="ab-badge__t">{eyebrowText}</span>
          </span>
          <h2 className="ab-title" aria-label={`About Me ${shortName}`} data-reveal>
            <span className="ab-title__row">
              <Chars text="ABOUT" offset={0} total={7} />
            </span>
            <span className="ab-title__row ab-title__row--2">
              <Chars text="ME" offset={5} total={7} />
              <span className="ab-title__name">{shortName}</span>
            </span>
          </h2>
          <p className="ab-role" data-intro data-reveal>
            <span className="ab-role__t">{roleLabel}</span>
          </p>
          <p className="ab-lead" data-intro data-reveal>
            {INTRO_LINE}
          </p>
          <div className="ab-actions" data-intro data-reveal>
            <a href="#contact" className="ab-cta">
              <span className="ab-cta__in">
                <span>Explore Journey</span>
                <span className="ab-cta__arrow">{Icon.arrow}</span>
              </span>
            </a>
            <span className="ab-hint">
              <span className="ab-hint__mouse">{Icon.mouse}</span>
              Scroll to explore
            </span>
          </div>
        </div>

        {/* 02 STORY */}
        <div className="ab-ch ab-ch--story">
          <div className="ab-story">
            <span className="ab-eyebrow" data-reveal>
              <b>01</b> The story
            </span>
            {paragraphs.map((p, i) => (
              <p className="ab-para" key={i} data-reveal>
                <Words text={p} />
              </p>
            ))}
          </div>
          <div className="ab-stats">
            {stats.map((s, i) => {
              const meta = STAT_META[i % STAT_META.length];
              return (
                <div
                  className="ab-stat"
                  key={s.label}
                  data-value={s.value}
                  data-suffix={s.suffix}
                  data-reveal
                  style={{ ["--accent" as string]: meta.accent } as CSSProperties}
                >
                  <div className="ab-stat__in">
                    <span className="ab-stat__ring">
                      <svg viewBox="0 0 64 64">
                        <circle className="ab-stat__track" cx="32" cy="32" r="26" />
                        <circle
                          className="ab-stat__arc"
                          cx="32"
                          cy="32"
                          r="26"
                          style={{ strokeDasharray: RING_C, strokeDashoffset: RING_C * (1 - meta.fill) }}
                        />
                      </svg>
                      <span className="ab-stat__icon">{meta.icon}</span>
                    </span>
                    <strong className={"ab-stat__num" + (s.suffix === "\u221E" ? " is-inf" : "")}>
                      {s.suffix === "\u221E" ? "\u221E" : `${s.value}${s.suffix}`}
                    </strong>
                    <span className="ab-stat__label">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 03 JOURNEY */}
        <div className="ab-ch ab-ch--journey">
          <div className="ab-jhead">
            <span className="ab-eyebrow" data-reveal>
              <b>02</b> My journey
            </span>
            <h3 className="ab-h3" data-reveal>
              From a <em>blank file</em> to shipped.
            </h3>
          </div>
          <div className="ab-jtrack">
            <svg className="ab-jpath" viewBox="0 0 1200 420" aria-hidden="true">
              <defs>
                <linearGradient id="ab-jg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1200" y2="0">
                  <stop offset="0%" stopColor="#5fd8ff" />
                  <stop offset="55%" stopColor="#8b7bff" />
                  <stop offset="100%" stopColor="#ff5fae" />
                </linearGradient>
              </defs>
              <path className="ab-jpath__ghost" d={PATH_D} />
              <path className="ab-jpath__line" d={PATH_D} />
            </svg>
            <span className="ab-comet" aria-hidden="true" />
            {JOURNEY.map((j, i) => (
              <div
                className={`ab-jnode ${i === 1 ? "is-below" : "is-above"}${stack ? " is-on" : ""}`}
                key={j.year}
                data-reveal
              >
                <span className="ab-jnode__dot" />
                <div className="ab-jcard">
                  <span className="ab-jcard__year">{j.year}</span>
                  <strong className="ab-jcard__title">{j.title}</strong>
                  <span className="ab-jcard__note">{j.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 04 DRIVE */}
        <div className="ab-ch ab-ch--drive">
          <div className="ab-dhead">
            <span className="ab-eyebrow" data-reveal>
              <b>03</b> What drives me
            </span>
          </div>
          <div className="ab-drives">
            {DRIVES.map((d, i) => (
              <div className="ab-drive" key={d.label} data-reveal>
                <div className="ab-drive__in">
                  <span className="ab-drive__no">0{i + 1}</span>
                  <span className="ab-drive__icon">{d.icon}</span>
                  <strong className="ab-drive__label">{d.label}</strong>
                  <span className="ab-drive__note">{d.note}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="ab-quote">
            <div className="ab-quote__main" data-reveal>
              <span className="ab-quote__mark">{Icon.quote}</span>
              <p className="ab-quote__text">
                <Words text={quoteText} />
              </p>
            </div>
            <div className="ab-quote__side">
              <div className="ab-sign" data-reveal>
                <span className="ab-sign__name">{fullName}</span>
                <span className="ab-sign__role">{roleLabel}</span>
              </div>
              <div className="ab-print" data-reveal>
                <span className="ab-print__icon">
                  {Icon.fingerprint}
                  <i />
                </span>
                <span>
                  Passion
                  <br />
                  Identified
                </span>
              </div>
              <a href="#contact" className="ab-cta ab-cta--ghost" data-reveal>
                <span className="ab-cta__in">
                  <span>Let&rsquo;s work together</span>
                  <span className="ab-cta__arrow">{Icon.arrow}</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- ticker ---------------- */}
      <div className="ab-ticker" aria-hidden="true">
        <div className="ab-ticker__track">
          {[0, 1].map((k) => (
            <div className="ab-ticker__set" key={k}>
              {tickerWords.map((w) => (
                <span key={w + k}>{w}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}