import { useEffect, useRef } from "react";
import type { CSSProperties, ReactElement } from "react";
import gsap from "gsap";
import { Icon, TechIcon } from "../content/icons";

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

interface SkillGroup {
  num: string;
  title: string;
  subtitle: string;
  accent: string;
  icon: ReactElement;
  tags: string[];
}

const CORE = {
  num: "01",
  title: "Core Stack",
  subtitle: "The foundation of everything",
  accent: "var(--cyan)",
  tags: ["Python", "Django", "FastAPI", "React", "PostgreSQL", "AI / ML"],
};

const ORBIT = [
  { id: "python", label: "Python", ring: 0, a: 0 },
  { id: "django", label: "Django", ring: 0, a: 120 },
  { id: "fastapi", label: "FastAPI", ring: 0, a: 240 },
  { id: "react", label: "React", ring: 1, a: 60 },
  { id: "postgres", label: "PostgreSQL", ring: 1, a: 180 },
  { id: "ai", label: "AI / ML", ring: 1, a: 300 },
];

const SKILL_GROUPS: SkillGroup[] = [
  { num: "02", title: "Backend & Web", subtitle: "Django • Web Development • APIs", accent: "var(--cyan)", icon: TechIcon.django,
    tags: ["Django", "Django ORM", "REST APIs", "API Integration", "JWT Authentication", "Full Stack Dev"] },
  { num: "03", title: "Frontend", subtitle: "Modern UI • Responsive Design", accent: "var(--sky)", icon: Icon.layers,
    tags: ["HTML5", "CSS3", "JavaScript", "Bootstrap 5", "Responsive Design"] },
  { num: "04", title: "Databases", subtitle: "SQL • Querying • Data Management", accent: "var(--teal)", icon: Icon.database,
    tags: ["SQLite", "MySQL", "Oracle SQL"] },
  { num: "05", title: "Programming Languages", subtitle: "Build • Code • Create", accent: "var(--violet)", icon: Icon.code,
    tags: ["Python", "SQL", "JavaScript (ES6+)", "HTML5", "CSS3", "OOP"] },
  { num: "06", title: "Generative AI / LLM", subtitle: "AI • Prompting • Innovation", accent: "var(--magenta)", icon: TechIcon.ai,
    tags: ["AI App Development", "Prompt Engineering", "OpenAI API", "Groq API", "LLaMA 3"] },
  { num: "07", title: "Data Science", subtitle: "Analyze • Predict • Build Impact", accent: "var(--leaf)", icon: Icon.bulb,
    tags: ["Data Cleaning", "Data Preprocessing", "EDA", "Data Visualization", "Power BI", "Pandas", "NumPy"] },
  { num: "08", title: "Developer Tools", subtitle: "Version Control • Collaboration", accent: "var(--violet)", icon: Icon.folder,
    tags: ["Git", "GitHub", "VS Code", "Debugging", "Testing", "Version Control", "Deployment"] },
  { num: "09", title: "Machine Learning", subtitle: "Learn • Build • Predict", accent: "var(--amber)", icon: Icon.target,
    tags: ["Scikit-learn", "Model Training & Evaluation", "Feature Engineering", "Classification"] },
  { num: "10", title: "Computer Vision", subtitle: "See • Detect • Understand", accent: "var(--crimson)", icon: Icon.sparkle,
    tags: ["OpenCV", "Image Processing"] },
  { num: "11", title: "Professional Skills", subtitle: "Solve • Improve • Grow", accent: "var(--cyan)", icon: Icon.briefcase,
    tags: ["Problem-Solving", "Team Collaboration", "Time Management"] },
];

const keyOf = (t: string) =>
  t.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9+#]+/g, " ").trim();
const pad = (n: number) => String(n).padStart(2, "0");

const keyCount = new Map<string, number>();
const keyAccent = new Map<string, string>();
const keyLabel = new Map<string, string>();
for (const g of [CORE, ...SKILL_GROUPS]) {
  for (const t of g.tags) {
    const k = keyOf(t);
    keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
    if (!keyLabel.has(k)) {
      keyLabel.set(k, t);
      keyAccent.set(k, g.accent);
    }
  }
}
const UNIQUE = Array.from(keyLabel.entries()).map(([k, label]) => ({
  k,
  label,
  accent: keyAccent.get(k) ?? "var(--cyan)",
}));
const ROW_A = UNIQUE.filter((_, i) => i % 2 === 0);
const ROW_B = UNIQUE.filter((_, i) => i % 2 === 1);
const SHARED = Array.from(keyCount.values()).filter((n) => n > 1).length;

const STATS = [
  { value: SKILL_GROUPS.length + 1, label: "Skill domains" },
  { value: UNIQUE.length, label: "Tools & skills" },
  { value: SHARED, label: "Shared across domains" },
];

const DUST = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  s: 2 + (i % 3),
  d: 16 + ((i * 7) % 18),
  delay: -((i * 5) % 24),
}));

const TITLE_MY = "My".split("");
const TITLE_SKILLS = "Skills".split("");
const DEFAULT_READOUT = "Hover any skill to trace where else it is used";

export default function SkillsSection() {
  const rootRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const grid = gridRef.current;
    if (!root || !grid) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups: Array<() => void> = [];
    const timers: number[] = [];
    const tweens: gsap.core.Tween[] = [];

    const cells = Array.from(grid.querySelectorAll<HTMLElement>(".sk2-cell"));
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".sk2-card"));
    const chips = Array.from(grid.querySelectorAll<HTMLElement>(".sk2-chip"));

    // 1. Scroll-in entrance
    if (reduce || !("IntersectionObserver" in window)) {
      for (const c of cells) c.classList.add("is-in", "is-done");
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target as HTMLElement;
            el.classList.add("is-in");
            timers.push(window.setTimeout(() => el.classList.add("is-done"), 2600));
            io.unobserve(el);
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
      );
      for (const c of cells) io.observe(c);
      cleanups.push(() => io.disconnect());
    }

    // 2. 3D tilt + spotlight (mouse only)
    if (canHover && !reduce) {
      for (const card of cards) {
        const move = (e: PointerEvent) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
          card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
          card.style.setProperty("--rx", `${((0.5 - py) * 7).toFixed(2)}deg`);
          card.style.setProperty("--ry", `${((px - 0.5) * 9).toFixed(2)}deg`);
        };
        const leave = () => {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
        };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", leave);
        });
      }

      const cursor = cursorRef.current;
      if (cursor) {
        const qx = gsap.quickTo(cursor, "x", { duration: 0.7, ease: "power3.out" });
        const qy = gsap.quickTo(cursor, "y", { duration: 0.7, ease: "power3.out" });
        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          qx(e.clientX - r.left);
          qy(e.clientY - r.top);
          root.classList.add("is-hover");
        };
        const onLeave = () => root.classList.remove("is-hover");
        root.addEventListener("pointermove", onMove);
        root.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          root.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
          gsap.killTweensOf(cursor);
        });
      }
    }

    // 3. Skill trace: hover a skill, every copy of it lights up
    const readout = readoutRef.current;
    let active: string | null = null;
    const setLink = (k: string | null) => {
      if (k === active) return;
      active = k;
      for (const c of chips) c.classList.remove("is-link");
      for (const c of cards) c.classList.remove("is-linked");
      grid.classList.remove("has-link");
      const pill = readout?.parentElement;
      if (!k) {
        if (readout) readout.textContent = DEFAULT_READOUT;
        pill?.classList.remove("is-active");
        return;
      }
      const hits = chips.filter((c) => c.dataset.k === k);
      for (const c of hits) {
        c.classList.add("is-link");
        c.closest(".sk2-card")?.classList.add("is-linked");
      }
      grid.classList.add("has-link");
      if (readout) {
        const names = hits.map((c) => c.dataset.g ?? "").filter(Boolean);
        const label = hits[0]?.dataset.label ?? "";
        readout.textContent =
          hits.length > 1
            ? `${label} · shared by ${hits.length} domains — ${names.join(" + ")}`
            : `${label} · ${names[0] ?? ""}`;
        pill?.classList.add("is-active");
      }
    };
    const onOver = (e: PointerEvent) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>(".sk2-chip");
      setLink(chip?.dataset.k ?? null);
    };
    const onGridLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") setLink(null);
    };
    grid.addEventListener("pointerover", onOver);
    grid.addEventListener("pointerleave", onGridLeave);
    cleanups.push(() => {
      grid.removeEventListener("pointerover", onOver);
      grid.removeEventListener("pointerleave", onGridLeave);
    });

    // 4. Count-up stats (waits until the white reveal poster is gone)
    const counters = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"));
    if (reduce) {
      for (const el of counters) el.textContent = pad(Number(el.dataset.count) || 0);
    } else {
      for (const el of counters) el.textContent = "00";
      let played = false;
      let visible = false;
      const posterGone = () => {
        const sr = document.querySelector<HTMLElement>(".sr");
        return !sr || getComputedStyle(sr).visibility === "hidden";
      };
      const play = () => {
        if (played) return;
        played = true;
        window.removeEventListener("scroll", tryPlay);
        counters.forEach((el, i) => {
          const to = Number(el.dataset.count) || 0;
          const o = { v: 0 };
          tweens.push(
            gsap.to(o, {
              v: to,
              duration: 1.8,
              delay: i * 0.15,
              ease: "power3.out",
              onUpdate: () => {
                el.textContent = pad(Math.round(o.v));
              },
            })
          );
        });
      };
      const tryPlay = () => {
        if (visible && posterGone()) play();
      };
      const stats = root.querySelector<HTMLElement>(".sk2-stats");
      if (stats && "IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            if (visible) {
              tryPlay();
              timers.push(window.setTimeout(play, 4500));
            }
          },
          { threshold: 0.5 }
        );
        io.observe(stats);
        window.addEventListener("scroll", tryPlay, { passive: true });
        cleanups.push(() => {
          io.disconnect();
          window.removeEventListener("scroll", tryPlay);
        });
      } else {
        play();
      }
    }

    return () => {
      for (const fn of cleanups) fn();
      for (const t of timers) window.clearTimeout(t);
      for (const tw of tweens) tw.kill();
    };
  }, []);

  return (
    <section className="sk2" id="skills" ref={rootRef} aria-label="Skills">
      <div className="sk2-bg" aria-hidden="true">
        <div className="sk2-aurora">
          <i className="sk2-aurora-a" />
          <i className="sk2-aurora-b" />
          <i className="sk2-aurora-c" />
        </div>
        <div className="sk2-floor">
          <div className="sk2-floor-in" />
        </div>
        <div className="sk2-dust">
          {DUST.map((d, i) => (
            <i key={i} style={{ "--x": `${d.x}%`, "--s": `${d.s}px`, "--d": `${d.d}s`, "--dl": `${d.delay}s` } as CSSVars} />
          ))}
        </div>
        <div className="sk2-cursor" ref={cursorRef} />
      </div>

      <div className="sk2-wrap">
        <header className="sk2-head">
          <div className="sk2-head-main">
            <div className="sk2-eyebrow">
              <span className="sk2-pulse" />
              <b>02</b> &mdash; CAPABILITIES
              <em>Stack &middot; Tools &middot; Craft</em>
            </div>

            <h2 className="sk2-title" aria-label="My Skills">
              <span className="sk2-word sk2-word--out" aria-hidden="true">
                {TITLE_MY.map((ch, i) => (
                  <span className="sk2-l" key={i} style={{ "--l": i } as CSSVars}>{ch}</span>
                ))}
              </span>
              <span className="sk2-word sk2-word--fill" aria-hidden="true">
                {TITLE_SKILLS.map((ch, i) => (
                  <span className="sk2-l" key={i} style={{ "--l": i + 2 } as CSSVars}>{ch}</span>
                ))}
              </span>
            </h2>

            <p className="sk2-lede">
              Every tool I build with, laid out in one view &mdash; from the Python and Django core to AI,
              vision and the way I work with people.
            </p>

            <div className="sk2-readout" aria-live="polite">
              <span className="sk2-readout-dot" />
              <span className="sk2-readout-text" ref={readoutRef}>{DEFAULT_READOUT}</span>
            </div>
          </div>

          <dl className="sk2-stats">
            {STATS.map((s, i) => (
              <div className="sk2-stat" key={s.label} style={{ "--n": i } as CSSVars}>
                <dt>{s.label}</dt>
                <dd><b data-count={s.value}>{pad(s.value)}</b></dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="sk2-grid" ref={gridRef}>
          <div className="sk2-cell sk2-cell--core" style={{ "--d": 0, "--i": 0 } as CSSVars}>
            <article className="sk2-card sk2-card--core" style={{ "--accent": CORE.accent } as CSSVars}>
              <span className="sk2-beam" aria-hidden="true" />
              <div className="sk2-face">
                <span className="sk2-spot" aria-hidden="true" />
                <div className="sk2-top">
                  <span className="sk2-num">{CORE.num} <i>//</i></span>
                  <span className="sk2-live"><i /> LIVE STACK</span>
                </div>

                <div className="sk2-orbit" aria-hidden="true">
                  <span className="sk2-ringline sk2-ringline--a" />
                  <span className="sk2-ringline sk2-ringline--b" />
                  {[0, 1].map((ring) => (
                    <div
                      key={ring}
                      className={`sk2-ring sk2-ring--${ring === 0 ? "a" : "b"}`}
                      style={{
                        "--t": ring === 0 ? "30s" : "46s",
                        "--rdir": ring === 0 ? "normal" : "reverse",
                        "--cdir": ring === 0 ? "reverse" : "normal",
                        "--r": ring === 0 ? "26cqw" : "42cqw",
                      } as CSSVars}
                    >
                      {ORBIT.filter((o) => o.ring === ring).map((o) => (
                        <span className="sk2-sat" key={o.id} style={{ "--a": `${o.a}deg` } as CSSVars} title={o.label}>
                          <span className="sk2-sat-a">
                            <span className="sk2-sat-b">{TechIcon[o.id]}</span>
                          </span>
                        </span>
                      ))}
                    </div>
                  ))}
                  <span className="sk2-orbit-core">CORE</span>
                </div>

                <div className="sk2-core-text">
                  <h3 className="sk2-name">{CORE.title}</h3>
                  <p className="sk2-sub">{CORE.subtitle}</p>
                  <ul className="sk2-chips">
                    {CORE.tags.map((t, n) => (
                      <li className="sk2-chip" key={t} data-k={keyOf(t)} data-g={CORE.title} data-label={t} style={{ "--n": n } as CSSVars}>
                        <i aria-hidden="true" />{t}
                      </li>
                    ))}
                  </ul>
                  <div className="sk2-foot">
                    <span className="sk2-count"><b>{pad(CORE.tags.length)}</b> skills</span>
                    <span className="sk2-eq" aria-hidden="true">
                      {CORE.tags.map((_, n) => (<i key={n} style={{ "--n": n } as CSSVars} />))}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {SKILL_GROUPS.map((g, i) => (
            <div className="sk2-cell" key={g.title} style={{ "--d": i % 3, "--i": i + 1 } as CSSVars}>
              <article className="sk2-card" style={{ "--accent": g.accent } as CSSVars}>
                <span className="sk2-beam" aria-hidden="true" />
                <div className="sk2-face">
                  <span className="sk2-spot" aria-hidden="true" />
                  <div className="sk2-top">
                    <span className="sk2-num">{g.num} <i>//</i></span>
                    <span className="sk2-icon">{g.icon}</span>
                  </div>
                  <h3 className="sk2-name">{g.title}</h3>
                  <p className="sk2-sub">{g.subtitle}</p>
                  <ul className="sk2-chips">
                    {g.tags.map((t, n) => (
                      <li className="sk2-chip" key={t} data-k={keyOf(t)} data-g={g.title} data-label={t} style={{ "--n": n } as CSSVars}>
                        <i aria-hidden="true" />{t}
                      </li>
                    ))}
                  </ul>
                  <div className="sk2-foot">
                    <span className="sk2-count"><b>{pad(g.tags.length)}</b> skills</span>
                    <span className="sk2-eq" aria-hidden="true">
                      {g.tags.map((_, n) => (<i key={n} style={{ "--n": n } as CSSVars} />))}
                    </span>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>

        <div className="sk2-marquee" aria-hidden="true">
          {[ROW_A, ROW_B].map((row, r) => (
            <div className={`sk2-track${r ? " sk2-track--rev" : ""}`} key={r}>
              {[...row, ...row].map((u, i) => (
                <span className="sk2-mi" key={`${u.k}-${i}`} style={{ "--accent": u.accent } as CSSVars}>
                  <i />{u.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}