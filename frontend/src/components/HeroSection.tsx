import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Navbar from "./Navbar";
import { glideToSection } from "../lib/glide";
import HeroGrid from "./HeroGrid";
import type { SiteData, SiteInfo, TechItem } from "../types/site";
import { Icon, TechIcon } from "../content/icons";

gsap.registerPlugin(ScrollTrigger);

const vars = (v: Record<string, string | number>) => v as CSSProperties;

/* ---------- rotating "building with ..." word ---------- */
function Rotator({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (words.length < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), 2200);
    return () => window.clearInterval(id);
  }, [words.length]);
  return (
    <span className="hv-rot">
      <span key={i} className="hv-rot-word">
        {words[i]}
      </span>
    </span>
  );
}

/* ---------- right side: pop-out photo on a disc, text ring, ghost type ---------- */
function HeroStage({ site, techStack }: { site: SiteInfo; techStack: TechItem[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const wrap = wrapRef.current;
    const tilt = tiltRef.current;
    if (!wrap || !tilt) return;
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 8}deg)`;
    wrap.style.setProperty("--tx", px.toFixed(3));
    wrap.style.setProperty("--ty", py.toFixed(3));
  };
  const onLeave = () => {
    const wrap = wrapRef.current;
    if (tiltRef.current) tiltRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
    if (wrap) {
      wrap.style.setProperty("--tx", "0");
      wrap.style.setProperty("--ty", "0");
    }
  };

  const one = techStack.map((t) => t.label.toUpperCase()).join("  \u2022  ") + "  \u2022  ";
  const ringText = one + one;
  const tags = techStack.slice(0, 4);

  return (
    <div className="hv-stage-r" ref={wrapRef} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="hv-halo" aria-hidden="true" />
      <span className="hv-ghosttext" aria-hidden="true">
        {site.roleHighlight}
      </span>

      <svg className="hv-textring" viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          <path id="hvRingPath" d="M200,200 m-170,0 a170,170 0 1,1 340,0 a170,170 0 1,1 -340,0" />
        </defs>
        <text>
          <textPath href="#hvRingPath" textLength="1068" lengthAdjust="spacing">
            {ringText}
          </textPath>
        </text>
      </svg>

      <div className="hv-disc" aria-hidden="true" />
      <div className="hv-orbit hv-orbit--1" aria-hidden="true"><i /></div>
      <div className="hv-orbit hv-orbit--2" aria-hidden="true"><i /></div>
      <span className="hv-spark hv-spark--1" aria-hidden="true" />
      <span className="hv-spark hv-spark--2" aria-hidden="true" />
      <span className="hv-spark hv-spark--3" aria-hidden="true" />

      <div className="hv-tilt" ref={tiltRef}>
        <img src="/images/hero-photo.png" alt={`Portrait of ${site.name}, ${site.heroTag}`} className="hv-photo" decoding="async" fetchPriority="high" />
      </div>

      {tags.map((t, i) => (
        <span className={`hv-tag hv-tag--${i + 1}`} key={t.label} style={vars({ "--k": i })} aria-hidden="true">
          <b>{String(i + 1).padStart(2, "0")}</b>
          {t.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- hero ---------- */
export default function HeroSection({ data, ready = true }: { data: SiteData; ready?: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const { site, navbar, techStack, about } = data;
  const stats = (about?.stats ?? []).slice(0, 3);
  const words = techStack.map((t) => t.label);
  const nameWords = site.name.trim().split(/\s+/);
  const [active, setActive] = useState(true);


  /* entrance timeline + scroll depth (paused until the intro ends) */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      tl.from(".nav", { y: -36, autoAlpha: 0, duration: 0.8 })
        .from(".hv-eyebrow > *", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, "-=0.45")
        .from(".hv-ch", { yPercent: 115, rotate: 7, autoAlpha: 0, duration: 0.95, stagger: 0.04, ease: "expo.out" }, "-=0.3")
        .from(".hv-role", { y: 22, autoAlpha: 0, duration: 0.6 }, "-=0.55")
        .from(".hv-now", { y: 18, autoAlpha: 0, duration: 0.5 }, "-=0.4")
        .from(".hv-sub", { y: 20, autoAlpha: 0, duration: 0.6 }, "-=0.35")
        .from(".hv-cta > *", { y: 22, autoAlpha: 0, stagger: 0.1, duration: 0.6, clearProps: "transform" }, "-=0.3")
        .from(".hv-stat", { y: 22, autoAlpha: 0, stagger: 0.1, duration: 0.6 }, "-=0.4")
        .from(".hv-disc", { autoAlpha: 0, scale: 0.6, duration: 1.1, ease: "expo.out" }, 0.3)
        .from(".hv-photo", { autoAlpha: 0, y: 70, scale: 0.94, duration: 1.2, ease: "expo.out" }, 0.45)
        .from(".hv-ghosttext", { autoAlpha: 0, y: 30, duration: 1.1 }, 0.6)
        .from(".hv-textring", { autoAlpha: 0, duration: 1.2 }, 0.7)
        .from(".hv-halo", { autoAlpha: 0, duration: 1 }, 0.7)
        .from(".hv-tag", { autoAlpha: 0, stagger: 0.12, duration: 0.7 }, 1.2)
        .from(".hv-marquee", { y: 30, autoAlpha: 0, duration: 0.8 }, 1.1);
      tlRef.current = tl;

      const st = { trigger: root, start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hv-copy", { y: -40, ease: "none", scrollTrigger: st });
      gsap.to(".hv-stage-r", { y: -70, ease: "none", scrollTrigger: st });
      gsap.to(".hv-gridwrap", { y: 90, ease: "none", scrollTrigger: st });
    }, root);
    return () => {
      tlRef.current = null;
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    rootRef.current?.classList.add("is-ready");
    tlRef.current?.play();
  }, [ready]);

  /* count-up numbers */
  useEffect(() => {
    if (!ready) return;
    const root = rootRef.current;
    if (!root) return;
    const tweens = Array.from(root.querySelectorAll<HTMLElement>("[data-count]")).map((el) => {
      const end = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffix ?? "";
      const o = { v: 0 };
      el.textContent = `0${suffix}`;
      return gsap.to(o, {
        v: end,
        duration: 1.8,
        delay: 1.7,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = `${Number.isInteger(end) ? Math.round(o.v) : o.v.toFixed(1)}${suffix}`;
        },
      });
    });
    return () => tweens.forEach((t) => t.kill());
  }, [ready]);

  /* smooth pointer parallax, magnetic buttons, and pause every loop while off-screen */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let tx = 0.5;
    let ty = 0.4;
    let cx = 0.5;
    let cy = 0.4;
    let raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      root.style.setProperty("--px", (cx - 0.5).toFixed(3));
      root.style.setProperty("--py", (cy - 0.5).toFixed(3));
      raf = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || root.classList.contains("is-paused")) return;
      const r = root.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
      kick();
    };
    const onLeave = () => {
      tx = 0.5;
      ty = 0.4;
      kick();
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);

    const magnets = Array.from(root.querySelectorAll<HTMLElement>(".hv-btn")).map((b) => {
      const mv = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - (r.left + r.width / 2)) * 0.22}px ${(e.clientY - (r.top + r.height / 2)) * 0.3}px`;
      };
      const lv = () => {
        b.style.translate = "0 0";
      };
      b.addEventListener("pointermove", mv);
      b.addEventListener("pointerleave", lv);
      return () => {
        b.removeEventListener("pointermove", mv);
        b.removeEventListener("pointerleave", lv);
      };
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        const vh = entry.rootBounds?.height ?? window.innerHeight;
        const live = entry.intersectionRect.height > vh * 0.4;
        root.classList.toggle("is-paused", !live);
        setActive(live);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );
    io.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      magnets.forEach((off) => off());
      io.disconnect();
    };
  }, []);

  const marquee = [...techStack, ...techStack, ...techStack];

  return (
    <section className="hero hero--light hv" id="home" ref={rootRef}>
      {/* ---------- white background: circuit grid + soft light ---------- */}
      <div className="hv-bg" aria-hidden="true">
        <span className="hv-orb hv-orb--a" />
        <span className="hv-orb hv-orb--b" />
        <span className="hv-spot" />
        <div className="hv-gridwrap">
          <div className="hv-gridlines" />
          <HeroGrid active={active} />
        </div>
      </div>

      <div className="hv-stage">
        <div className="hv-inner">
          <Navbar navbar={navbar} siteName={site.name} />

          <div className="hv-body">
            <div className="hv-copy">
              <div className="hv-eyebrow">
                <span className="hv-wave">{site.heroWave}</span>
                <span className="hv-eyebrow-label">{site.heroIntroLabel}</span>
                <span className="hv-eyebrow-line" />
                {site.availability && (
                  <span className="hv-avail">
                    <span className="status-dot" />
                    {site.availability}
                  </span>
                )}
              </div>

              <h1 className="hv-name" aria-label={site.name}>
                {nameWords.map((w, wi) => (
                  <span className={`hv-word${wi === nameWords.length - 1 ? " hv-word--grad" : ""}`} key={wi} aria-hidden="true">
                    {Array.from(w).map((ch, ci) => (
                      <span className="hv-ch" key={ci} style={vars({ "--i": ci })}>
                        {ch}
                      </span>
                    ))}
                  </span>
                ))}
              </h1>

              <h2 className="hv-role">
                <span className="hv-role-hl">{site.roleHighlight}</span> <span className="hv-role-rest">{site.roleSuffix}</span>
              </h2>

              {words.length > 1 && (
                <p className="hv-now">
                  <span className="status-dot" />
                  <span>Building with</span>
                  <Rotator words={words} />
                  <span className="hv-caret" />
                </p>
              )}

              <p className="hv-sub">{site.subhead}</p>

              <div className="hv-cta">
                <a href="#projects" className="hv-btn hv-btn-primary">
                  <span>View Projects</span>
                  <span className="hv-btn-icon">{Icon.arrow}</span>
                </a>
                <a href="#/resume" className="hv-btn hv-btn-outline">
                  <span className="hv-btn-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                      <path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h4" />
                    </svg>
                  </span>
                  <span>Resume</span>
                </a>
                <a
                  href="#contact"
                  className="hv-btn hv-btn-outline"
                  onClick={(e) => {
                    e.preventDefault();
                    void glideToSection("#contact");
                  }}
                >
                  <span className="hv-btn-icon">{Icon.mail}</span>
                  <span>Get in touch</span>
                </a>
              </div>

              {stats.length > 0 && (
                <div className="hv-stats">
                  {stats.map((s) => (
                    <div className="hv-stat" key={s.label}>
                      <span className="hv-stat-num" data-count={s.value} data-suffix={s.suffix}>
                        {s.value}
                        {s.suffix}
                      </span>
                      <span className="hv-stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <HeroStage site={site} techStack={techStack} />
          </div>

          <div className="hv-marquee">
            <div className="hv-mq-label">
              <small>{site.taglineSmall}</small>
              <b>{site.taglineBig}</b>
            </div>
            <div className="hv-mq-viewport">
              <div className="hv-mq-track">
                {[0, 1].map((k) => (
                  <ul className="hv-mq-list" key={k} aria-hidden={k === 1 ? "true" : undefined}>
                    {marquee.map((t, i) => (
                      <li key={`${t.label}-${i}`}>
                        <span className={`hv-mq-ic hx-ic--${t.icon}`}>{TechIcon[t.icon]}</span>
                        {t.label}
                        <i />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}