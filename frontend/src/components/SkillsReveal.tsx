import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

const BG_IMAGE = "/images/skillsbg.png";

// Letters of the big poster word. Each one flies out on its own timing.
const LETTERS = "SKILLS".split("");

// Words that slide across the poster while it assembles.
const TICKER = ["Python", "Django", "Flutter", "FastAPI", "React", "SQL", "Docker", "AI / ML"];

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Scroll phases across the pinned distance (0 → 1)
const ASSEMBLE_END = 0.34; // letters fly in and lock together
const HOLD_END = 0.58; // the word stays fully readable until here, then the dive starts
const PIN_SCREENS = 3.6; // how many screens of scrolling the whole sequence lasts

export default function SkillsReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

    // WHITE KNOCKOUT ZOOM-THROUGH (About -> Skills)
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const wrap = root.querySelector<HTMLElement>(".sr");
    const svg = root.querySelector<SVGSVGElement>(".sr__svg");
    const maskEl = root.querySelector<SVGMaskElement>(".sr__mask");
    const mRect = root.querySelector<SVGRectElement>(".sr__mrect");
    const paper = root.querySelector<SVGRectElement>(".sr__paper");
    const gridRect = root.querySelector<SVGRectElement>(".sr__gridrect");
    const mZoom = root.querySelector<SVGGElement>(".sr__mzoom");
    const mLets = Array.from(root.querySelectorAll<SVGGElement>(".sr__mlet"));
    const oZooms = [0, 1, 2].map((c) => root.querySelector<SVGGElement>(`.sr__oz${c}`));
    const oLets = oZooms.map((g) => Array.from(g?.querySelectorAll<SVGGElement>(".sr__olet") ?? []));
    const allTxt = Array.from(root.querySelectorAll<SVGTextElement>(".sr__txt"));
    const measureTxt = Array.from(root.querySelectorAll<SVGTextElement>(".sr__oz0 .sr__txt"));
    const ret = root.querySelector<SVGGElement>(".sr__ret");
    const ui = root.querySelector<HTMLElement>(".sr__ui");
    const sub = root.querySelector<HTMLElement>(".sr__sub");
    const tickTop = root.querySelector<HTMLElement>(".sr__tickin--top");
    const tickBot = root.querySelector<HTMLElement>(".sr__tickin--bot");
    const content = root.querySelector<HTMLElement>(".skills-reveal__content");
    const bar = root.querySelector<HTMLElement>(".sr__bar");
    const beam = root.querySelector<HTMLElement>(".sr__beam");
    const count = root.querySelector<HTMLElement>(".sr__count b");
    if (!wrap || !svg || !maskEl || !mRect || !paper || !gridRect || !mZoom || !mLets.length) return;

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const lMid = (LETTERS.length - 1) / 2;
    const FOCUS = 2; // the "I" of SKILLS: the camera dives into its stem
    const ECHO = [1, 1.3, 1.7]; // scale multipliers of the outline echoes
    const ECHO_OP = [1, 0.5, 0.22];

    let W = 0, H = 0, fs = 100, cy = 0, fx = 0, zMax = 80, lastPct = -1;
    const xs: number[] = LETTERS.map(() => 0);
    // Letter widths as a fraction of the font size. Kept between layouts so a bad
    // re-measure (which happens while the pin toggles on scroll-up) can't collapse the word.
    let unitW: number[] = LETTERS.map(() => 0.68);
    const state = { p: 0 };

    if (content) content.style.transformOrigin = "50% 0";
    let diveOn = false; // poster ink flips black -> white once the dive starts
    let gridOn = true;

    const render = (p: number) => {
      const a = clamp01(p / ASSEMBLE_END);
      const q = clamp01((p - HOLD_END) / (1 - HOLD_END));
      const hold = a * (1 - clamp01(q / 0.2)); // 1 while the word is fully shown
      const e = easeInOutCubic(q);
      const Z = Math.pow(zMax, e);
      const rot = -e * 7;

      // per-letter assemble transform (same for the cut-out and its echoes)
      for (let k = 0; k < LETTERS.length; k++) {
        const dk = Math.abs(k - lMid) / lMid;
        const s = 1 - easeOutCubic(clamp01((a - dk * 0.4) / 0.6));
        const dir = k % 2 === 0 ? -1 : 1;
        const float = Math.sin(p * 18 + k * 0.9) * fs * 0.014 * hold;
        const tf =
          `translate(${(xs[k] + (k - lMid) * s * fs * 0.35).toFixed(2)} ${(cy + dir * s * fs * 0.9 + float).toFixed(2)}) ` +
          `rotate(${(dir * s * 18).toFixed(2)}) scale(${(1 + s * 0.5).toFixed(3)})`;
        const vis = String(1 - s);
        const m = mLets[k];
        if (m) {
          m.setAttribute("transform", tf);
          m.style.opacity = vis;
        }
        for (let c = 0; c < 3; c++) {
          const o = oLets[c][k];
          if (o) {
            o.setAttribute("transform", tf);
            o.style.opacity = vis;
          }
        }
      }

      // camera dive, anchored on the stem of the "I"
      const zoomTf = (m: number) =>
        `translate(${fx.toFixed(2)} ${cy.toFixed(2)}) rotate(${rot.toFixed(2)}) ` +
        `scale(${(Z * m).toFixed(4)}) translate(${(-fx).toFixed(2)} ${(-cy).toFixed(2)})`;
      mZoom.setAttribute("transform", zoomTf(1));
      const echoFade = 1 - clamp01(q / 0.5);
      oZooms.forEach((g, c) => {
        if (!g) return;
        g.setAttribute("transform", zoomTf(ECHO[c]));
        g.style.opacity = String(ECHO_OP[c] * (c === 0 ? 1 : echoFade) * (c === 0 ? 1 - clamp01((e - 0.8) / 0.2) : 1));
      });

      // targeting reticle around the focus letter
      if (ret) {
        ret.setAttribute(
          "transform",
          `translate(${fx.toFixed(2)} ${cy.toFixed(2)}) rotate(${(p * 220).toFixed(1)}) scale(${((fs / 220) * (1 + e * 5)).toFixed(3)})`
        );
        ret.style.opacity = String(a * (1 - clamp01(q / 0.3)));
      }

      if (ui) ui.style.opacity = String(1 - clamp01(q / 0.3));
      if (sub) {
        const r = easeOutCubic(clamp01((a - 0.55) / 0.45));
        sub.style.opacity = String(r);
        sub.style.transform = `translate3d(0, ${((1 - r) * 18).toFixed(1)}px, 0)`;
      }
      if (tickTop) tickTop.style.transform = `translate3d(${(-p * 38).toFixed(2)}%,0,0)`;
      if (tickBot) tickBot.style.transform = `translate3d(${((p - 1) * 38).toFixed(2)}%,0,0)`;

      if (beam) {
        beam.style.transform = `scale3d(${easeOutCubic(a)}, 1, 1)`;
        beam.style.opacity = String(1 - clamp01(q / 0.25));
      }

      if (content) {
        content.style.transform = q >= 0.999 ? "" : `scale(${(1.12 - e * 0.12).toFixed(4)})`;
        // promote to its own GPU layer only while it is being scaled
        content.style.willChange = q >= 0.999 ? "auto" : "transform";
      }

      const pct = Math.round(clamp01(p) * 100);
      if (count && pct !== lastPct) {
        lastPct = pct;
        count.textContent = String(pct).padStart(3, "0");
      }
      if (bar) bar.style.transform = `scaleX(${clamp01(p)})`;

      svg.style.opacity = String(1 - clamp01((e - 0.94) / 0.06));
      wrap.style.visibility = q >= 0.999 ? "hidden" : "visible";

      // cheap replacements for the two things that forced a full re-paint every frame
      const dive = q > 0.12;
      if (dive !== diveOn) {
        diveOn = dive;
        wrap.classList.toggle("sr--dive", dive);
      }
      const showGrid = q < 0.02;
      if (showGrid !== gridOn) {
        gridOn = showGrid;
        gridRect.style.display = showGrid ? "" : "none";
      }
    };

    // measure the word and fit the SVG to the viewport-sized poster
    const layout = () => {
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      if (!W || !H) return;
      fs = Math.min(Math.max(64, W * 0.17), 300);
      cy = H * 0.47;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      maskEl.setAttribute("width", String(W));
      maskEl.setAttribute("height", String(H));
      [mRect, paper, gridRect].forEach((r) => {
        r.setAttribute("width", String(W));
        r.setAttribute("height", String(H));
      });
      allTxt.forEach((t) => (t.style.fontSize = `${fs}px`));

      const track = fs * 0.05;
      const raw = measureTxt.map((t) => t.getComputedTextLength() / fs);
      if (raw.every((w) => w > 0.2)) unitW = raw; // ignore zero / partial measurements
      const widths = unitW.map((w) => w * fs);
      const total = widths.reduce((s, w) => s + w, 0) + track * (widths.length - 1);
      let x = W / 2 - total / 2;
      widths.forEach((w, k) => {
        xs[k] = x + w / 2;
        x += w + track;
      });
      fx = xs[FOCUS];
      // stem of the "I" is roughly 9% of the font size: dive until it covers the screen
      zMax = Math.min(260, Math.max(40, (1.45 * Math.max(W, H)) / (fs * 0.09)));

      if (sub) sub.style.top = `${cy + fs * 0.62}px`;
      if (beam) beam.style.top = `${cy}px`;
      render(state.p);
    };

    layout();
    let dead = false;
    document.fonts?.ready.then(() => {
      if (!dead) layout();
    });
    const ro = new ResizeObserver(() => layout());
    ro.observe(wrap);

    let passed = false; // true once the scroll position is beyond the end of the pin
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      onUpdate: () => {
        // scrubbing lags behind the scroll. If the page is already past the pin,
        // never replay the dive on a section that has scrolled away.
        render(passed ? 1 : state.p);
      },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * PIN_SCREENS)}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        onUpdate: (self) => {
          // instant hand-off the moment the pin is passed (fast flick, scrollbar
          // drag, jump link): hide the poster NOW instead of after the lag
          const past = self.progress >= 0.9999;
          if (past !== passed) {
            passed = past;
            if (past) render(1);
          }
        },
      },
    });
    return () => {
      dead = true;
      ro.disconnect();
      tween.scrollTrigger?.kill(true);
      tween.kill();
    };
  }, []);

  // Performance governor
  //  a) pre-decode the big background image while the browser is idle
  //  b) pause decorative CSS loops while Skills is off-screen (.skills-idle)
  //  c) pause the autoplay videos (Hero / About) while they are off-screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const warm = () => {
      const img = new Image();
      img.decoding = "async";
      img.src = BG_IMAGE;
      img.decode?.().catch(() => undefined);
    };
    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (idle) idle(warm, { timeout: 2500 });
    else window.setTimeout(warm, 800);

    const sectionIO = new IntersectionObserver(
      ([entry]) => el.classList.toggle("skills-idle", !entry.isIntersecting),
      { rootMargin: "160px 0px" }
    );
    sectionIO.observe(el);

    const videoIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) v.play().catch(() => undefined);
          else v.pause();
        }
      },
      { rootMargin: "80px 0px" }
    );
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("video[autoplay]"));
    videos.forEach((v) => videoIO.observe(v));

    return () => {
      sectionIO.disconnect();
      videoIO.disconnect();
    };
  }, []);

  // NO snapping. Scrolling is fully free. This only adds a class while the
  // page is moving so decorative animations pause and scroll frames stay light.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer = 0;
    let busy = false;

    const onScroll = () => {
      if (!busy) {
        busy = true;
        el.classList.add("skills-scrolling");
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        busy = false;
        el.classList.remove("skills-scrolling");
      }, 120);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      el.classList.remove("skills-scrolling");
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (reduceMotion) {
    return <div ref={ref}>{children}</div>;
  }

  return (
    <div ref={ref} className="skills-reveal">
      <div className="skills-reveal__content">{children}</div>

            <div className="sr" aria-hidden="true">
        <svg className="sr__svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="sr-grid" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M72 0H0V72" fill="none" stroke="rgba(11,11,16,0.07)" strokeWidth="1" />
            </pattern>
            {/* white = poster stays, black = knocked out (the letters) */}
            <mask id="sr-knockout" className="sr__mask" maskUnits="userSpaceOnUse" x="0" y="0">
              <rect className="sr__mrect" x="0" y="0" fill="#fff" />
              <g className="sr__mzoom">
                {LETTERS.map((ch, k) => (
                  <g className="sr__mlet" key={k}>
                    <text className="sr__txt" textAnchor="middle" dominantBaseline="central" fill="#000">{ch}</text>
                  </g>
                ))}
              </g>
            </mask>
          </defs>

          <g mask="url(#sr-knockout)">
            <rect className="sr__paper" x="0" y="0" fill="#ffffff" />
            <rect className="sr__gridrect" x="0" y="0" fill="url(#sr-grid)" />
          </g>

          {/* hairline outline + two ripple echoes of the cut-out word */}
          {[0, 1, 2].map((c) => (
            <g className={`sr__oz sr__oz${c}`} key={c}>
              {LETTERS.map((ch, k) => (
                <g className="sr__olet" key={k}>
                  <text
                    className="sr__txt"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="none"
                    stroke="#0b0b10"
                    strokeWidth={c === 0 ? 1.6 : 1}
                    vectorEffect="non-scaling-stroke"
                  >
                    {ch}
                  </text>
                </g>
              ))}
            </g>
          ))}

          <g className="sr__ret">
            <circle r="118" fill="none" stroke="#0b0b10" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="2 9" vectorEffect="non-scaling-stroke" />
            <circle r="86" fill="none" stroke="#0b0b10" strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d="M-150 0H-100M100 0H150M0 -150V-100M0 100V150" stroke="#0b0b10" strokeOpacity="0.7" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>

        <div className="sr__ui">
          <div className="sr__frame" />
          <div className="sr__meta sr__meta--tl"><b>02</b> &mdash; CAPABILITIES</div>
          <div className="sr__meta sr__meta--tr">ABOUT &rarr; SKILLS</div>
          <div className="sr__tick sr__tick--top">
            <div className="sr__tickin sr__tickin--top">
              {Array.from({ length: 4 }, () => TICKER).flat().map((t, i) => (<span key={i}>{t}</span>))}
            </div>
          </div>
          <div className="sr__sub">Stack &middot; Tools &middot; Craft</div>
          <div className="sr__tick sr__tick--bot">
            <div className="sr__tickin sr__tickin--bot">
              {Array.from({ length: 4 }, () => TICKER).flat().map((t, i) => (<span key={i}>{t}</span>))}
            </div>
          </div>
          <div className="sr__meta sr__meta--bl">SCROLL TO DIVE IN</div>
          <div className="sr__meta sr__meta--br">&#10022; &#10022; &#10022;</div>
        </div>

        <div className="sr__beam" />
        <div className="sr__count"><span>SKILLS</span><b>000</b><i>%</i></div>
        <div className="sr__progress"><span className="sr__bar" /></div>
      </div>
    </div>
  );
}