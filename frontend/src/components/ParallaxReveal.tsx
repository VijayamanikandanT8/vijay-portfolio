import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Snap from "lenis/snap";
import "@fontsource/anton";
import "@fontsource/ms-madi";
import "./ParallaxReveal.css";

gsap.registerPlugin(ScrollTrigger);

// One screen: the demo's first image (src/assets/parallax/01.webp)
const found = import.meta.glob("../assets/parallax/01.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const IMAGE_SRC = Object.values(found)[0] as string | undefined;

/* ---- curved text marquee ---- */
const BEND = 1290; // resting curve depth (path control-point y)
const pathWhite = (cy: number) => `M -900 150 Q 960 ${cy} 2820 150`;
const pathScript = (cy: number) => `M -900 40 Q 960 ${cy - 220} 2820 40`;
const REPEAT_WHITE = 9;
const REPEAT_SCRIPT = 16;

type Props = {
  name?: string;
  word?: string; // big white word
  script?: string; // red script word
};

export default function ParallaxReveal({
  word = "VIJAY",
  script = "Developer",
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const whiteText = `${word}. `.repeat(REPEAT_WHITE);
  const scriptText = `${script} `.repeat(REPEAT_SCRIPT);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !IMAGE_SRC) return;
    const hero = root.querySelector<HTMLElement>(".ip-hero")!;
    const image = hero.querySelector("picture");
    const svg = root.querySelector<SVGSVGElement>(".ip-marquee")!;
    const pW = root.querySelector<SVGPathElement>("#ipPathW")!;
    const pS = root.querySelector<SVGPathElement>("#ipPathS")!;
    const txtW = root.querySelector<SVGTextElement>(".ip-white")!;
    const txtS = root.querySelector<SVGTextElement>(".ip-script")!;
    const tpW = txtW.querySelector("textPath")!;
    const tpS = txtS.querySelector("textPath")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- exact values from the demo's scripts.js ----
    const ANIMATION = {
      IMAGE: { before: -50, after: 50 },
      MARQUEE: { before: 1.5, after: 0.5 },
    };
    const SHARED = {
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        fastScrollEnd: true,
      },
    };

    const state = { prog: 0, drift: 0, cy: BEND, targetCy: BEND, tilt: 0, targetTilt: 0, live: true };
    let unitW = 1500;
    let unitS = 700;

    const ctx = gsap.context(() => {
      // image parallax (demo)
      gsap.set(image, { yPercent: ANIMATION.IMAGE.before });
      gsap.fromTo(
        image,
        { yPercent: ANIMATION.IMAGE.before },
        { yPercent: ANIMATION.IMAGE.after, ...SHARED },
      );

      // marquee scale (demo)
      gsap.set(svg, { scale: ANIMATION.MARQUEE.before });
      gsap.fromTo(svg, { scale: ANIMATION.MARQUEE.before }, { scale: ANIMATION.MARQUEE.after, ...SHARED });

      // scroll progress drives the text sliding along the curve
      ScrollTrigger.create({
        trigger: hero,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => (state.prog = self.progress),
      });

      // intro: text rises in + header/footer fade
      if (!reduce) {
        gsap.fromTo(
          ".ip-txt",
          { autoAlpha: 0, yPercent: 12 },
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: { trigger: root, start: "top 75%", once: true },
          },
        );
      }
    }, root);

    // measure one repeat of each word so the marquee loops seamlessly
    const measure = () => {
      const w = txtW.getComputedTextLength() / REPEAT_WHITE;
      const s = txtS.getComputedTextLength() / REPEAT_SCRIPT;
      if (w > 50) unitW = w;
      if (s > 20) unitS = s;
    };
    measure();
    document.fonts?.ready?.then(measure).catch(() => {});

    // pointer bends the curve + tilts the text
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = root.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      state.targetCy = BEND + py * 420;
      state.targetTilt = px * 3;
    };
    const onLeave = () => {
      state.targetCy = BEND;
      state.targetTilt = 0;
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(([e]) => (state.live = e.isIntersecting), { threshold: 0 });
    io.observe(root);

    const wrap = (v: number, u: number) => ((v % u) + u) % u;
    let lastCy = Infinity;
    let lastTilt = Infinity;
    const tick = (_t: number, dt: number) => {
      if (!state.live) return;
      if (!reduce) state.drift += dt * 0.09; // constant slow drift (px per ms)
      state.cy += (state.targetCy - state.cy) * 0.08;
      state.tilt += (state.targetTilt - state.tilt) * 0.08;

      // re-building the curve is costly: only do it while it is actually moving
      if (Math.abs(state.cy - lastCy) > 0.05 || lastCy === Infinity) {
        lastCy = state.cy;
        pW.setAttribute("d", pathWhite(state.cy));
        pS.setAttribute("d", pathScript(state.cy));
      }
      if (Math.abs(state.tilt - lastTilt) > 0.001) {
        lastTilt = state.tilt;
        svg.style.rotate = `${state.tilt.toFixed(3)}deg`;
      }

      const scroll = state.prog * 2600; // scroll slides the words
      tpW.setAttribute("startOffset", String(-wrap(scroll + state.drift, unitW)));
      tpS.setAttribute("startOffset", String(-wrap(-scroll * 1.6 - state.drift * 1.5, unitS)));
    };
    gsap.ticker.add(tick);

    // ---- demo's Lenis snap (same easing / duration), on this one screen ----
    let snap: Snap | undefined;
    const lenis = window.__lenis;
    if (lenis) {
      try {
        snap = new Snap(lenis, {
          type: "proximity",
          debounce: 500,
          duration: 0.9,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
        });
        snap.addElements([hero], { align: "start" });
      } catch (e) {
        console.warn("ParallaxReveal: snap disabled", e);
      }
    }

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      try {
        snap?.destroy();
      } catch {
        /* ignore */
      }
      ctx.revert();
    };
  }, []);

  if (!IMAGE_SRC) return null;

  return (
    <section className="ip" id="reveal" ref={rootRef}>
      <div className="ip-hero">
        <picture className="ip-image">
          <img src={IMAGE_SRC} alt="" decoding="async" />
        </picture>

        {/* curved, scroll-driven text marquee */}
        <svg className="ip-marquee" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <path id="ipPathW" d={pathWhite(BEND)} />
            <path id="ipPathS" d={pathScript(BEND)} />
          </defs>
          <g className="ip-txt">
            <text className="ip-white">
              <textPath href="#ipPathW" startOffset="0">
                {whiteText}
              </textPath>
            </text>
            <text className="ip-script">
              <textPath href="#ipPathS" startOffset="0">
                {scriptText}
              </textPath>
            </text>
          </g>
        </svg>
      </div>

      
    </section>
  );
}