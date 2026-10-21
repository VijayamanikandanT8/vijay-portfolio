import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import SplitType from "split-type";
import "./CertTransition.css";

gsap.registerPlugin(ScrollTrigger);

// Cards that fly through the band. Keep in sync with your certificates
// (images live in public/images/certifications).
const CARDS = [
  { name: "Python Full Stack", image: "/images/certifications/1.jpg" },
  { name: "Data Analytics", image: "/images/certifications/2.jpg" },
  { name: "Skill & Job Recommender", image: "/images/certifications/3.jpg" },
  { name: "C Programming", image: "/images/certifications/4.jpg" },
  { name: "Typewriting (Senior)", image: "/images/certifications/5.jpg" },
  { name: "AI Tools & Claude", image: "/images/certifications/6.jpg" },
];

const diamond = (r: number, cx: number, cy: number) =>
  `polygon(${cx}px ${cy - r}px, ${cx + r}px ${cy}px, ${cx}px ${cy + r}px, ${cx - r}px ${cy}px)`;

export default function CertTransition() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.display = "none";
      return;
    }

    const q = (s: string) => root.querySelector<HTMLElement>(s)!;
    const shutters = [q(".cx__shutter--top"), q(".cx__shutter--bottom")];
    const ring = q(".cx__ring");
    const bg = q(".cx__bg");
    const content = q(".cx__content");
    const word = q(".cx__word");
    const track = q(".cx__track");
    const bar = q(".cx__bar");
    const countEl = q(".cx__count");
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".cx__card"));

    const split = new SplitType(word, { types: "chars" });
    const chars = split.chars ?? [];

    // 45deg diamond iris (same rotated-square language as the certificate overlay)
    const iris = { d: 0 };
    const applyIris = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      const r = iris.d * ((w + h) / 2 + 4);
      const lead = iris.d > 0 && iris.d < 1 ? 14 * Math.sin(Math.PI * iris.d) : 0;
      bg.style.clipPath = diamond(r, w / 2, h / 2);
      ring.style.clipPath = diamond(r > 0 ? r + lead : 0, w / 2, h / 2);
    };
    applyIris();

    // Cards fan out near the edges and straighten as they cross the centre.
    const applyCards = () => {
      const w = root.clientWidth;
      const tx = Number(gsap.getProperty(track, "x"));
      cards.forEach((card) => {
        const center = tx + card.offsetLeft + card.offsetWidth / 2;
        const d = (center - w / 2) / (w / 2);
        const a = Math.min(Math.abs(d), 1);
        gsap.set(card, {
          rotation: gsap.utils.clamp(-40, 40, d * 26),
          scale: 1 - a * 0.2,
          y: a * 36,
        });
      });
    };

    const skewTo = gsap.quickTo(track, "skewX", { duration: 0.6, ease: "power3" });
    const count = { v: 0 };

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root,
        start: "top 70%",
        end: "bottom 35%",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          skewTo(gsap.utils.clamp(-6, 6, self.getVelocity() / -250));
        },
        onScrubComplete: () => skewTo(0),
        onRefresh: () => {
          applyIris();
          applyCards();
        },
      },
    });

    tl
      // 1) Education's black shutters close from top and bottom
      .fromTo(shutters, { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: "power3.inOut" }, 0)
      // 2) a crimson-edged diamond opens from the centre
      .to(iris, { d: 1, duration: 0.5, ease: "power2.inOut", onUpdate: applyIris }, 0.28)
      // 3) certificate cards travel sideways like the horizontal track
      .fromTo(
        track,
        { x: () => root.clientWidth },
        { x: () => -track.scrollWidth, duration: 0.8, onUpdate: applyCards },
        0.12,
      )
      // 4) title letters rise out of their mask (Education's reveal style)
      .fromTo(
        chars,
        { yPercent: 110 },
        { yPercent: 0, stagger: 0.02, duration: 0.3, ease: "power3.out" },
        0.45,
      )
      .to(count, {
        v: CARDS.length,
        duration: 0.6,
        onUpdate: () => {
          countEl.textContent = String(Math.round(count.v)).padStart(2, "0");
        },
      }, 0.3)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      // 5) everything lifts away, leaving the Certifications background
      .to(content, { opacity: 0, yPercent: -6, duration: 0.12, ease: "power1.in" }, 0.9);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      split.revert();
    };
  }, []);

  return (
    <div className="cx" ref={rootRef} aria-hidden="true">
      <div className="cx__shutter cx__shutter--top" />
      <div className="cx__shutter cx__shutter--bottom" />
      <div className="cx__ring" />
      <div className="cx__bg" />

      <div className="cx__content">
        <div className="cx__meta">
          <span>Education &mdash; 03</span>
          <span>
            Credentials <b className="cx__count">00</b> / {String(CARDS.length).padStart(2, "0")}
          </span>
        </div>

        <h2 className="cx__word">Certifications</h2>

        <div className="cx__cards">
          <div className="cx__track">
            {CARDS.map((c, i) => (
              <figure className="cx__card" key={c.name}>
                <div className="cx__card-img" style={{ backgroundImage: `url(${c.image})` }} />
                <span className="cx__card-no">{String(i + 1).padStart(2, "0")}</span>
                <figcaption className="cx__card-name">{c.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="cx__progress">
          <span className="cx__bar" />
        </div>
      </div>
    </div>
  );
}