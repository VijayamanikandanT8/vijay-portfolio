import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./ResumePage.css";

// ---------------------------------------------------------------------------
// EDIT THIS PART to change the content of the resume page
// ---------------------------------------------------------------------------
const PDF = "/resume/resume.pdf";
const FILE_NAME = "Vijayamanikandan_T_Resume.pdf";

const ROLE = "Python Full Stack Developer";

const SUMMARY =
  "Python Full Stack Developer who builds Django and AI/ML products end to end: REST APIs, clean responsive interfaces, LLM integrations and machine-learning models.";

const STATS = [
  { to: 35, dec: 0, suffix: "+", label: "Django & AI/ML deliverables" },
  { to: 88, dec: 0, suffix: "%+", label: "Heart-disease model accuracy" },
  { to: 8.35, dec: 2, suffix: "", label: "B.E. CGPA" },
];

const EXPERIENCE = [
  {
    role: "Python Full Stack Developer",
    org: "JLA Tech Services · Erode",
    period: "Nov 2025 – Present",
    text: "Django REST APIs with JWT and SQL, responsive UIs with Bootstrap 5, OpenAI and Groq (LLaMA 3) integrations, Scikit-learn models and an OpenCV vision module.",
  },

  {
    role: "Trainee · .NET & Web Technologies",
    org: "M & S Software India Pvt. Ltd. · Chennai",
    period: "Jun – Sep 2023",
    text: "Three-month training programme in .NET and web technologies; recognised by the company director as sincere and hardworking.",
  },
  {
    role: "Project Intern",
    org: "M & S Software India Pvt. Ltd. · Chennai",
    period: "Jan – Apr 2023",
    text: "Worked on real-world software project tasks in a professional team and gained hands-on exposure to the development lifecycle.",
  },
];

const EDUCATION = {
  degree: "B.E. Computer Science",
  school: "Nadar Saraswathi College of Engineering and Technology, Theni",
  period: "2019 – 2023",
  score: "CGPA 8.35",
};

const SKILLS: { group: string; items: string[] }[] = [
  { group: "Backend", items: ["Python", "Django", "Django REST", "FastAPI", "JWT"] },
  { group: "Frontend", items: ["HTML5", "CSS3", "JavaScript", "React", "Bootstrap 5", "Flutter"] },
  { group: "AI / ML", items: ["Scikit-learn", "Pandas", "NumPy", "OpenCV", "OpenAI API", "Groq (LLaMA 3)"] },
  { group: "Data & Tools", items: ["SQL", "MySQL", "SQLite", "Oracle SQL", "Git", "Docker"] },
];

// ---------------------------------------------------------------------------
// remember where the visitor last clicked: the ripple opens from that point
// ---------------------------------------------------------------------------
let lastPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener(
  "pointerdown",
  (e) => {
    lastPoint = { x: e.clientX, y: e.clientY };
  },
  true,
);

interface Props {
  name: string;
  email?: string;
  location?: string;
  onBack: () => void;
}

const Label = ({ n, children }: { n: string; children: string }) => (
  <div className="rp-label">
    <b>{n}</b>
    <span>{children}</span>
    <i />
  </div>
);

export default function ResumePage({ name, email, location, onBack }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const backRef = useRef(onBack);
  const closeRef = useRef<() => void>(() => {});
  const closingRef = useRef(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    backRef.current = onBack;
  });

  // page title + Esc key
  useEffect(() => {
    const prev = document.title;
    document.title = `Resume | ${name}`;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.title = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [name]);

  // opening + closing animation
  useLayoutEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const root = holder.querySelector<HTMLElement>(".rp")!;
    const wipes = Array.from(holder.querySelectorAll<HTMLElement>(".rp-wipe"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      closeRef.current = () => backRef.current();
      return;
    }

    const { x, y } = lastPoint;
    const R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) * 1.08;
    const circle = (r: number) => `circle(${r}px at ${x}px ${y}px)`;

    closeRef.current = () => {
      if (closingRef.current) return;
      closingRef.current = true;
      gsap.killTweensOf([root, ...wipes]);
      gsap.set(wipes, { display: "block", clipPath: circle(R) });
      gsap.set(root, { clipPath: circle(R) });
      gsap
        .timeline({ onComplete: () => backRef.current() })
        .to(root, { clipPath: circle(0), duration: 0.85, ease: "power3.inOut" }, 0)
        .to([...wipes].reverse(), { clipPath: circle(0), duration: 0.85, ease: "power3.inOut", stagger: 0.09 }, 0.18);
    };

    const ctx = gsap.context(() => {
      gsap.set([...wipes, root], { clipPath: circle(0) });
      gsap.set(wipes, { display: "block" });
      root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => (el.textContent = "0"));

      const tl = gsap.timeline();
      // 1) colour ripple: pink -> violet -> cyan -> the page itself
      tl.to(wipes, { clipPath: circle(R), duration: 1.1, ease: "power3.inOut", stagger: 0.09 }, 0)
        .to(root, { clipPath: circle(R), duration: 1.1, ease: "power3.inOut" }, 0.3)
        .set(wipes, { display: "none" })
        .set(root, { clearProps: "clipPath" })
        // 2) content
        .from(".rp-top", { y: -24, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.9)
        .from(".rp-ch", { yPercent: 120, rotateX: -70, opacity: 0, transformOrigin: "0% 100%", duration: 0.9, ease: "expo.out", stagger: 0.035 }, 0.85)
        .from(".rp-kicker, .rp-sub, .rp-actions", { y: 26, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.09 }, 1.0)
        .from(".rp-card", { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.11 }, 1.15)
        .from(".rp-docenter", { rotationX: -60, y: 90, opacity: 0, transformPerspective: 1400, transformOrigin: "50% 0%", duration: 1.3, ease: "expo.out", onComplete: () => void gsap.set(".rp-docenter", { clearProps: "all" }) }, 1.05)
        .from(".rp-tl-line", { scaleY: 0, transformOrigin: "top", duration: 1.4, ease: "power2.inOut" }, 1.5)
        .from(".rp-tl-item", { x: -18, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.12 }, 1.5)
        .from(".rp-chip", { scale: 0.6, opacity: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.025 }, 1.9);

      // counters
      root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const end = parseFloat(el.dataset.count ?? "0");
        const dec = parseInt(el.dataset.dec ?? "0", 10);
        const o = { v: 0 };
        tl.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: () => void (el.textContent = o.v.toFixed(dec)) }, 1.4);
      });
    }, holder);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={holderRef}>
      <div className="rp-wipe rp-wipe--a" />
      <div className="rp-wipe rp-wipe--b" />
      <div className="rp-wipe rp-wipe--c" />

      <div className="rp" role="dialog" aria-modal="true" aria-label="Resume" data-lenis-prevent>
        <div className="rp-bg" aria-hidden="true">
          <i className="rp-aurora rp-aurora--1" />
          <i className="rp-aurora rp-aurora--2" />
          <i className="rp-aurora rp-aurora--3" />
          <i className="rp-grid" />
        </div>
        <div className="rp-ghost" aria-hidden="true">RESUME</div>

        <div className="rp-inner">
          {/* top bar */}
          <div className="rp-top">
            <span className="rp-brand"><i /> Résumé</span>
            <button type="button" className="rp-btn rp-btn-ghost" onClick={() => closeRef.current()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
              Back to Hero <kbd>Esc</kbd>
            </button>
          </div>

          {/* headline */}
          <header className="rp-head">
            <p className="rp-kicker">{ROLE}</p>
            <h1 className="rp-name" aria-label={name}>
              {name.split(" ").map((word, wi) => (
                <span className="rp-word" key={wi} aria-hidden="true">
                  {word.split("").map((c, ci) => (
                    <span className="rp-mask" key={ci}><span className="rp-ch">{c}</span></span>
                  ))}
                </span>
              ))}
            </h1>

            <div className="rp-actions">
              <a className="rp-btn rp-btn-primary" href={PDF} download={FILE_NAME} onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2600); }}>
                {saved ? (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg> Downloaded</>
                ) : (
                  <><svg className="rp-dl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></svg> Download Resume</>
                )}
              </a>
              <a className="rp-btn rp-btn-outline" href={PDF} target="_blank" rel="noopener noreferrer">
                Open full PDF
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
              </a>
            </div>
          </header>

          <div className="rp-main">
            {/* details */}
            <div className="rp-col">
              <section className="rp-card">
                <Label n="01">Profile</Label>
                <p className="rp-summary">{SUMMARY}</p>
                <dl className="rp-facts">
                  <div><dt>Role</dt><dd>{ROLE}</dd></div>
                  {location && <div><dt>Based in</dt><dd>{location}</dd></div>}
                  {email && <div><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>}

                </dl>
                <div className="rp-stats">
                  {STATS.map((s) => (
                    <div className="rp-stat" key={s.label}>
                      <strong><b data-count={s.to} data-dec={s.dec}>{s.to}</b>{s.suffix}</strong>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rp-card">
                <Label n="02">Experience</Label>
                <div className="rp-tl">
                  <i className="rp-tl-line" />
                  {EXPERIENCE.map((e) => (
                    <div className="rp-tl-item" key={e.role + e.org}>
                      <h3>{e.role}</h3>
                      <p className="rp-org">{e.org}{e.period && <em>{e.period}</em>}</p>
                      <p className="rp-txt">{e.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rp-card">
                <Label n="03">Education</Label>
                <div className="rp-edu">
                  <h3>{EDUCATION.degree}</h3>
                  <p className="rp-org">{EDUCATION.school}</p>
                  <p className="rp-edu-meta"><em>{EDUCATION.period}</em><em>{EDUCATION.score}</em></p>
                </div>
              </section>

              <section className="rp-card">
                <Label n="04">Skills</Label>
                {SKILLS.map((g) => (
                  <div className="rp-skillgroup" key={g.group}>
                    <h4>{g.group}</h4>
                    <div className="rp-chips">
                      {g.items.map((s) => (<span className="rp-chip" key={s}>{s}</span>))}
                    </div>
                  </div>
                ))}
              </section>
            </div>

            {/* PDF preview */}
            <aside className="rp-side">
              <div className="rp-docenter">
                <div className="rp-doc">
                  <div className="rp-doc-in">
                    <div className="rp-chrome">
                      <span className="rp-dots"><i /><i /><i /></span>
                      <span className="rp-file">{FILE_NAME}</span>
                      <a href={PDF} download={FILE_NAME} aria-label="Download resume" className="rp-mini">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></svg>
                      </a>
                    </div>
                    <div className="rp-pdf">
                      <object type="application/pdf" data={`${PDF}#toolbar=0&navpanes=0&view=FitH`}>
                        <div className="rp-fallback">
                          <h2>Preview is not available on this device</h2>
                          <p>Your browser can&rsquo;t show PDFs inline. Download the resume to read it.</p>
                          <a className="rp-btn rp-btn-primary" href={PDF} download={FILE_NAME}>Download Resume</a>
                        </div>
                      </object>
                      <i className="rp-scan" />
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}