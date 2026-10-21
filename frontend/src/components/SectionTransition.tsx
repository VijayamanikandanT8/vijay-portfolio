import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitType from "split-type";
import "./SectionTransition.css";

gsap.registerPlugin(ScrollTrigger);

// Words shown in the scrolling strips (taken from your Experience / Education lists).
const FROM_ITEMS = ["Intern", "Full Stack", "AI & ML", "Vision"];
const TO_ITEMS = ["SSLC", "HSC", "B.E. Computer Science"];

const repeat = (items: string[], times = 8) =>
  Array.from({ length: times }, () => items).flat();

const SLANT = 28; // how diagonal the wipe edge is (% of width)
const START = 100 + SLANT;

export default function SectionTransition() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = (s: string) => root.querySelector<HTMLElement>(s)!;

    const panel = q(".xt__panel");
    const edge = q(".xt__edge");
    const fromWord = q(".xt__word--from");
    const toWord = q(".xt__word--to");
    const fromTrack = q(".xt__track--from");
    const toTrack = q(".xt__track--to");
    const toMeta = q(".xt__panel .xt__meta");

    const fromSplit = new SplitType(fromWord, { types: "chars" });
    const toSplit = new SplitType(toWord, { types: "chars" });
    const fromChars = fromSplit.chars ?? [];
    const toChars = toSplit.chars ?? [];

    // Diagonal wipe: a slanted polygon sliding from right to left.
    const state = { e: START };
    const clip = (e: number) => `polygon(${e}% 0, 100% 0, 100% 100%, ${e - SLANT}% 100%)`;
    const apply = () => {
      panel.style.clipPath = clip(state.e);
      // cyan leading edge that trails slightly ahead of the beige panel
      const p = 1 - state.e / START;
      const lead = 7 * 4 * p * (1 - p);
      edge.style.clipPath = clip(state.e - lead);
    };
    apply();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      state.e = 0;
      apply();
      return () => {
        fromSplit.revert();
        toSplit.revert();
      };
    }

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root,
        start: "top 75%",
        end: "bottom 25%",
        scrub: true,
      },
    });

    tl.to(state, { e: 0, ease: "power1.inOut", duration: 1, onUpdate: apply }, 0)
      // EXPERIENCE letters lift out, EDUCATION letters rise in (mask reveal)
      .to(fromChars, { yPercent: -110, stagger: 0.035, duration: 0.45, ease: "power2.in" }, 0.12)
      .fromTo(
        toChars,
        { yPercent: 110 },
        { yPercent: 0, stagger: 0.04, duration: 0.5, ease: "power3.out" },
        0.4,
      )
      // opposite-direction strips + slight parallax on the big words
      .to(fromTrack, { xPercent: -35, duration: 1 }, 0)
      .fromTo(toTrack, { xPercent: -35 }, { xPercent: 0, duration: 1 }, 0)
      .to(fromWord, { x: "-5vw", duration: 1 }, 0)
      .fromTo(toWord, { x: "5vw" }, { x: 0, duration: 1 }, 0)
      .fromTo(toMeta, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.55);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      fromSplit.revert();
      toSplit.revert();
    };
  }, []);

  return (
    <div className="xt" ref={rootRef} aria-hidden="true">
      {/* Layer 1: Experience side (dark) */}
      <div className="xt__layer xt__base">
        <div className="xt__meta">
          <span>Roles &amp; work history</span>
          <span>04</span>
        </div>
        <h2 className="xt__word xt__word--from">Experience</h2>
        <div className="xt__marquee">
          <div className="xt__track xt__track--from">
            {repeat(FROM_ITEMS).map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Layer 2: cyan leading edge */}
      <div className="xt__edge" />

      {/* Layer 3: Education side (beige), revealed by the diagonal wipe */}
      <div className="xt__layer xt__panel">
        <div className="xt__meta">
          <span>Schools &amp; qualifications</span>
          <span>03</span>
        </div>
        <h2 className="xt__word xt__word--to">Education</h2>
        <div className="xt__marquee">
          <div className="xt__track xt__track--to">
            {repeat(TO_ITEMS).map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}