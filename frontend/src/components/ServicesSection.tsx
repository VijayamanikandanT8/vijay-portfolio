import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import "./ServicesSection.css";

// ---------------------------------------------------------------------------
// SERVICES / WHAT I DO
// React + GSAP 3 port of Codrops "Grid Layout with Motion Hover Effect and
// Content Preview" (GridLayoutMotion).
//
// EDIT THE LIST BELOW to change your services.
//   img      -> picture number: public/images/services/<img>.jpg  (grid card)
//               and public/images/services/original/<img>.jpg     (preview)
//   title    -> big outlined word (keep it short, 3-6 letters looks best)
//   text     -> small boxed label
//   *Mod     -> layout variants, space separated:
//               titleMod: straight | bottom | left
//               textMod : bottom | topcloser | bottomcloser | right
//               innerMod: rotated1 | rotated2 | rotated3 | reverse
//               decoMod : top | left
//   deco     -> little decorative glyph (optional)
//   quote    -> small caption shown beside the card on wide screens (optional)
//   detail   -> paragraph shown in the full-screen preview
// ---------------------------------------------------------------------------
interface Service {
  img: number;
  title: string;
  text: string;
  titleMod?: string;
  textMod?: string;
  innerMod?: string;
  deco?: string;
  decoMod?: string;
  quote?: string;
  detail: string;
  provides?: string[]; // "What you get" list shown in the preview
}

const SERVICES: Service[] = [
  {
    img: 1,
    title: "Web",
    text: "Stack",
    deco: "\u271E",
    quote: "“Fast, responsive web apps from database to browser.”",
    detail:
      "Fast, good-looking websites and web apps, designed, built and launched for you, from the first sketch to a live link.",
    provides: [
      "Responsive, animated UI (React, HTML, CSS, JavaScript)",
      "Python backend (Django / Flask) with a proper database",
      "Admin panel so you can manage your own content",
      "Hosting setup and live deployment",
    ],
  },
  {
    img: 2,
    title: "API",
    text: "Backend",
    titleMod: "straight bottom",
    textMod: "bottom",
    innerMod: "rotated1",
    deco: "\u2783",
    decoMod: "top",
    detail: "Secure, well-documented APIs that power your web and mobile apps reliably.",
    provides: [
      "REST APIs with Django REST Framework or FastAPI",
      "Login with JWT, roles and permissions",
      "Database design (MySQL, SQLite, Oracle SQL)",
      "API documentation and testing",
    ],
  },
  {
    img: 3,
    title: "AI",
    text: "Gen AI",
    textMod: "topcloser",
    deco: "\u2730",
    detail:
      "Smart features powered by LLMs: chatbots, assistants and text tools that work right inside your product.",
    provides: [
      "OpenAI and Groq (LLaMA 3) API integration",
      "Custom chatbot built for your use case",
      "Content generation and text prediction",
      "Tested prompts and safe, reliable outputs",
    ],
  },
  {
    img: 5,
    title: "Deep",
    text: "Learning",
    textMod: "bottom right",
    innerMod: "rotated3",
    detail:
      "Neural networks designed, trained and explained, so you understand the model, not just the result.",
    provides: [
      "Model design and training in Python",
      "Image and text classification projects",
      "Evaluation reports with clear charts",
      "Clean notebooks with a full explanation",
    ],
  },
  {
    img: 6,
    title: "ML",
    text: "Models",
    textMod: "bottomcloser",
    detail: "Machine Learning from raw data to a working prediction system you can actually use.",
    provides: [
      "Data cleaning and feature engineering",
      "Scikit-learn classification and regression models",
      "Accuracy report with clear results",
      "Model connected to a web app",
    ],
  },
  {
    img: 7,
    title: "Flutter",
    text: "Mobile",
    quote: "“One codebase, every screen.”",
    detail: "One codebase, two platforms: smooth, animated Android and iOS apps.",
    provides: [
      "Android and iOS apps with Flutter and Dart",
      "REST API and Firebase integration",
      "Clean architecture and state management",
      "Release-ready build and handover guidance",
    ],
  },
  {
    img: 8,
    title: "Python",
    text: "Developer",
    titleMod: "straight bottom",
    textMod: "bottom",
    innerMod: "rotated1",
    detail: "Python done properly: from quick automation scripts to production-ready services.",
    provides: [
      "Custom scripts and automation tools",
      "Django and FastAPI services",
      "Testing, debugging and performance tuning",
      "Clean, commented, easy-to-maintain code",
    ],
  },
  {
    img: 4,
    title: "Data",
    text: "Analytics",
    textMod: "bottom",
    deco: "\u277C",
    detail: "Turn messy spreadsheets and databases into clear answers and live dashboards.",
    provides: [
      "Data cleaning with Pandas and NumPy",
      "SQL queries and reports",
      "Interactive charts and dashboards",
      "Insights summarised in plain language",
    ],
  },
  {
    img: 10,
    title: "Talk",
    text: "Speaking",
    textMod: "bottom",
    detail: "Engaging sessions that make AI and modern software easy to understand.",
    provides: [
      "Guest lectures and technical seminars",
      "Hands-on workshops for students and teams",
      "AI, Machine Learning and software topics",
      "Slides and live demos included",
    ],
  },
  {
    img: 11,
    title: "Mentor",
    text: "Projects",
    titleMod: "bottom",
    innerMod: "rotated2",
    quote: "“Build it, understand it, present it with confidence.”",
    detail:
      "Student projects built with you, not just for you, so you can explain every part with confidence.",
    provides: [
      "Final-year, mini and academic projects (Python, Django, Web, AI/ML)",
      "Step-by-step guidance and explanation of every module",
      "Project report, PPT and viva preparation",
      "Career advice and project review for juniors",
    ],
  },
  {
    img: 12,
    title: "Ship",
    text: "Deploy",
    titleMod: "straight left",
    textMod: "bottom right",
    innerMod: "rotated3",
    deco: "\u27A9",
    decoMod: "top",
    detail: "From localhost to the live web: deployed, documented and handed over properly.",
    provides: [
      "Git workflow, Docker and cloud hosting",
      "Live deployment with domain and SSL",
      "Documentation: project report, SRS, user manual, API docs",
      "Handover session and post-launch support",
    ],
  },
];

// grid order: the number is an index into SERVICES, "cta" is the contact card
// (the same slot the original demo used for its sponsor card).
const CELLS: (number | "cta")[] = [0, 1, 2, "cta", 3, 4, 5, 6, 7, 8, 9, 10];
const CTA_IMG = 9;

const BODY_LOCK = "svc-lock";

// BEM-ish helper: cls("a", "x y") -> "a a--x a--y"
const cls = (base: string, mods = "") =>
  [base, ...mods.split(" ").filter(Boolean).map((m) => `${base}--${m}`)].join(" ");

// ---------------------------------------------------------------------------
// motion helpers (same maths as the original demo.js)
// ---------------------------------------------------------------------------
const lineEq = (y2: number, y1: number, x2: number, x1: number, v: number) => {
  const m = (y2 - y1) / (x2 - x1);
  const b = y1 - m * x1;
  return m * v + b;
};
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

type Axis = number | [number, number] | undefined;
interface Vec {
  x?: Axis;
  y?: Axis;
  z?: Axis;
}
interface Fx {
  translation?: Vec;
  rotation?: Vec;
  reverse?: { duration: number; ease: string };
}
type Part = "image" | "title" | "text" | "deco" | "shadow" | "content";

// how far each part of a card travels / rotates while the mouse moves over it
const FX: Record<Part, Fx> = {
  image: { translation: { x: -10, y: -10, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
  title: { translation: { x: 20, y: 10, z: 0 } },
  text: { translation: { x: 20, y: 50, z: 0 }, rotation: { x: 0, y: 0, z: -20 } },
  deco: { translation: { x: -20, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 3 } },
  shadow: {
    translation: { x: 30, y: 20, z: 0 },
    rotation: { x: 0, y: 0, z: -2 },
    reverse: { duration: 2, ease: "back.out" },
  },
  content: { translation: { x: 5, y: 3, z: 0 } },
};

const PARTS: Record<Part, string> = {
  image: ".svc-box__img",
  title: ".svc-box__title",
  text: ".svc-box__text",
  deco: ".svc-box__deco",
  shadow: ".svc-box__shadow",
  content: ".svc-box__content",
};

const range = (a: Axis): [number, number] => {
  if (a === undefined) return [0, 0];
  if (typeof a === "number") return [-a, a];
  return a;
};

// ---------------------------------------------------------------------------
export default function ServicesSection({ email = "" }: { email?: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // cards start hidden, they rise into view as they scroll in
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.set(root.querySelectorAll(".svc-item"), { opacity: 0, y: 70 });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const overlay = overlayRef.current;
    if (!root || !overlay) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveal = overlay.querySelector<HTMLElement>(".svc-ov__reveal")!;
    const closeBtn = overlay.querySelector<HTMLButtonElement>(".svc-ov__close")!;
    const previews = Array.from(overlay.querySelectorAll<HTMLElement>(".svc-ov__item"));
    const anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>("a.svc-item"));

    let allowTilt = true;
    let isOpen = false;
    let current: HTMLElement | null = null;
    let origin: HTMLElement | null = null;

    gsap.set(reveal, { xPercent: 100 });

    // ---------------- grid items: motion hover ----------------
    const cleanups: Array<() => void> = [];

    // every animatable part of a card (grid cards only)
    const partsOf = (el: HTMLElement) =>
      (Object.keys(PARTS) as Part[])
        .map((k) => ({ key: k, el: el.querySelector<HTMLElement>(PARTS[k]) }))
        .filter((p): p is { key: Part; el: HTMLElement } => p.el !== null);

    const cards = anchors.map((el) => ({ el, parts: partsOf(el) }));

    cards.forEach(({ el, parts }) => {
      let enter = false;
      let timer = 0;

      const onEnter = () => {
        enter = false;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => (enter = true), 40);
      };

      const tilt = (ev: MouseEvent) => {
        if (!allowTilt || reduce) return;
        const b = el.getBoundingClientRect();
        const rx = ev.clientX - b.left;
        const ry = ev.clientY - b.top;
        parts.forEach(({ key, el: part }) => {
          const fx = FX[key];
          const t = { x: range(fx.translation?.x), y: range(fx.translation?.y), z: range(fx.translation?.z) };
          const r = { x: range(fx.rotation?.x), y: range(fx.rotation?.y), z: range(fx.rotation?.z) };
          gsap.to(part, {
            duration: 1.5,
            ease: "power1.out",
            overwrite: "auto",
            x: ((t.x[1] - t.x[0]) / b.width) * rx + t.x[0],
            y: ((t.y[1] - t.y[0]) / b.height) * ry + t.y[0],
            z: ((t.z[1] - t.z[0]) / b.height) * ry + t.z[0],
            rotationX: ((r.x[1] - r.x[0]) / b.height) * ry + r.x[0],
            rotationY: ((r.y[1] - r.y[0]) / b.width) * rx + r.y[0],
            rotationZ: ((r.z[1] - r.z[0]) / b.width) * rx + r.z[0],
          });
        });
      };

      let raf = 0;
      const onMove = (ev: MouseEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          if (enter) tilt(ev);
        });
      };

      const onLeave = () =>
        requestAnimationFrame(() => {
          if (!enter || !allowTilt) return;
          enter = false;
          window.clearTimeout(timer);
          parts.forEach(({ key, el: part }) => {
            const rev = FX[key].reverse;
            gsap.to(part, {
              duration: rev ? rev.duration : 1.5,
              ease: rev ? rev.ease : "power2.out",
              overwrite: "auto",
              x: 0,
              y: 0,
              z: 0,
              rotationX: 0,
              rotationY: 0,
              rotationZ: 0,
            });
          });
        });

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        window.clearTimeout(timer);
        cancelAnimationFrame(raf);
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      });
    });

    // ---------------- preview overlay ----------------
    const revealPreview = () => {
      if (!current) return;
      current.style.opacity = "1";
      current.style.pointerEvents = "auto";
      const els = [
        ".svc-box__shadow",
        ".svc-box__img",
        ".svc-box__title",
        ".svc-box__text",
        ".svc-box__deco",
        ".svc-ov__content",
      ]
        .map((s) => current!.querySelector<HTMLElement>(s))
        .filter((e): e is HTMLElement => e !== null);

      const win = { width: window.innerWidth, height: window.innerHeight };
      els.forEach((el) => {
        const b = el.getBoundingClientRect();
        const dx = Math.abs(b.left + b.width - win.width);
        const dy = Math.abs(b.top + b.height - win.height);
        gsap.to(el, {
          duration: lineEq(0.8, 1.2, win.width, 0, dx),
          ease: "expo.out",
          delay: 0.2,
          startAt: {
            x: lineEq(0, 800, win.width, 0, dx),
            y: lineEq(-100, 100, win.height, 0, dy),
            rotationZ: lineEq(5, 30, 0, win.width, dx),
          },
          x: 0,
          y: 0,
          rotationZ: 0,
        });
      });
    };

    const showOverlay = (item: HTMLElement) => {
      current = item;
      overlay.classList.add("svc-ov--open");
      overlay.setAttribute("aria-hidden", "false");
      gsap.to(reveal, {
        duration: 0.5,
        ease: "power1.inOut",
        xPercent: 0,
        onComplete: () => {
          document.body.classList.add(BODY_LOCK);
          revealPreview();
          gsap.to(reveal, { duration: 0.5, delay: 0.2, ease: "power3.out", xPercent: -100 });
          closeBtn.style.opacity = "1";
          closeBtn.focus({ preventScroll: true });
        },
      });
    };

    const hideOverlay = () => {
      overlay.classList.remove("svc-ov--open");
      gsap.to(reveal, {
        duration: 0.5,
        ease: "power3.out",
        xPercent: 0,
        onComplete: () => {
          closeBtn.style.opacity = "0";
          document.body.classList.remove(BODY_LOCK);
          if (current) { current.style.opacity = "0"; current.style.pointerEvents = ""; }
          overlay.setAttribute("aria-hidden", "true");
          gsap.to(reveal, { duration: 0.5, ease: "power3.out", xPercent: 100 });
          origin?.focus({ preventScroll: true });
        },
      });
    };

    // ---------------- open / close ----------------
    const openItem = (index: number, from: HTMLElement) => {
      if (isOpen) return;
      const item = previews[index];
      if (!item) return;
      isOpen = true;
      allowTilt = false;
      origin = from;
      showOverlay(item);

      // "explode" the grid
      const win = { width: window.innerWidth, height: window.innerHeight };
      cards.forEach(({ parts }) => {
        parts.forEach(({ el }) => {
          const b = el.getBoundingClientRect();
          const d = Math.abs(b.left + b.width - win.width);
          let x: number;
          let y: number;
          if (b.top + b.height / 2 < win.height / 2 - win.height * 0.1) {
            x = -1 * lineEq(20, 600, 0, win.width, d);
            y = -1 * lineEq(20, 600, 0, win.width, d);
          } else if (b.top + b.height / 2 > win.height / 2 + win.height * 0.1) {
            x = -1 * lineEq(20, 600, 0, win.width, d);
            y = lineEq(20, 600, 0, win.width, d);
          } else {
            x = -1 * lineEq(10, 700, 0, win.width, d);
            y = randInt(-25, 25);
          }
          gsap.to(el, {
            duration: 0.4,
            ease: "power3.out",
            overwrite: "auto",
            delay: lineEq(0, 0.3, 0, win.width, d),
            x,
            y,
            rotationZ: randInt(-10, 10),
            opacity: 0,
          });
        });
      });
    };

    const closeItem = () => {
      if (!isOpen) return;
      isOpen = false;
      hideOverlay();
      const w = window.innerWidth;
      cards.forEach(({ parts }) => {
        parts.forEach(({ el }) => {
          const b = el.getBoundingClientRect();
          gsap.to(el, {
            duration: 0.6,
            ease: "expo.out",
            overwrite: "auto",
            delay: 0.55 + lineEq(0, 0.2, 0, w, Math.abs(b.left + b.width - w)),
            x: 0,
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            opacity: 1,
          });
        });
      });
      allowTilt = true;
    };

    anchors.forEach((a) => {
      if (a.classList.contains("svc-item--noclick")) return;
      const onClick = (e: MouseEvent) => {
        e.preventDefault();
        openItem(Number(a.dataset.svc), a);
      };
      a.addEventListener("click", onClick);
      cleanups.push(() => a.removeEventListener("click", onClick));
    });

    closeBtn.addEventListener("click", closeItem);
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") closeItem();
      else if (e.key === "Tab") {
        e.preventDefault(); // the close button is the only control in the dialog
        closeBtn.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);

    // ---------------- entrance: cards rise in as they scroll into view ----
    let io: IntersectionObserver | null = null;
    if (!reduce) {
      gsap.set(anchors, { opacity: 0, y: 70 });
      let queue: HTMLElement[] = [];
      let flush = 0;
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            io?.unobserve(en.target);
            queue.push(en.target as HTMLElement);
          });
          window.clearTimeout(flush);
          flush = window.setTimeout(() => {
            if (!queue.length) return;
            gsap.to(queue, {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "expo.out",
              stagger: 0.12,
              clearProps: "opacity,transform",
            });
            queue = [];
          }, 30);
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      anchors.forEach((a) => io!.observe(a));
      cleanups.push(() => window.clearTimeout(flush));
    }

    return () => {
      cleanups.forEach((fn) => fn());
      io?.disconnect();
      closeBtn.removeEventListener("click", closeItem);
      document.removeEventListener("keydown", onKey);
      const all: Element[] = [reveal, ...anchors];
      cards.forEach(({ parts }) => parts.forEach(({ el }) => all.push(el)));
      gsap.killTweensOf(all);
      gsap.set(all, { clearProps: "all" });
      previews.forEach((p) => {
        gsap.killTweensOf(p.querySelectorAll("*"));
        p.style.opacity = "0";
        p.style.pointerEvents = "";
      });
      document.body.classList.remove(BODY_LOCK);
    };
  }, []);

  const renderBox = (s: Service, preview: boolean) => (
    <div className="svc-box">
      <div className="svc-box__shadow" />
      <img
        className={`svc-box__img${preview ? " svc-box__img--original" : ""}`}
        src={preview ? `/images/services/original/${s.img}.jpg` : `/images/services/${s.img}.jpg`}
        alt=""
        decoding="async"
        draggable={false}
      />
      <h3 className={cls("svc-box__title", s.titleMod)}>
        <span className="svc-box__title-inner" {...(preview ? {} : { "data-hover": s.title })}>
          {s.title}
        </span>
      </h3>
      <h4 className={cls("svc-box__text", s.textMod)}>
        <span className={cls("svc-box__text-inner", s.innerMod)}>{s.text}</span>
      </h4>
      {s.deco && <div className={cls("svc-box__deco", s.decoMod)}>{s.deco}</div>}
      {!preview && s.quote && <p className="svc-box__content">{s.quote}</p>}
    </div>
  );

  const mailto = email ? `mailto:${email}` : "#services";

  return (
    <section className="svc" id="services" ref={rootRef}>
      <header className="svc-header">
        <span className="svc-header__eyebrow">Services</span>
        <h2 className="svc-header__title">What I Do</h2>
        <p className="svc-header__sub">
          Web apps, AI, mobile apps, student projects and documentation, built end to end. Click any card to see exactly what you get.
        </p>
      </header>

      <div className="svc-grid">
        {CELLS.map((c) =>
          c === "cta" ? (
            <a className="svc-item svc-item--noclick" href={mailto} key="cta">
              <div className="svc-box">
                <div className="svc-box__shadow" />
                <img className="svc-box__img" src={`/images/services/${CTA_IMG}.jpg`} alt="" decoding="async" draggable={false} />
                <h4 className="svc-box__text">
                  <span className="svc-box__text-inner svc-box__text-inner--rotated2 svc-box__text-inner--reverse">
                    Let&rsquo;s talk
                  </span>
                </h4>
                <p className="svc-box__content">
                  <strong>Have a project in mind?</strong> I build web apps, APIs and AI solutions from idea to
                  launch. <strong>Let&rsquo;s work together</strong>
                </p>
              </div>
            </a>
          ) : (
            <a
              className="svc-item"
              href={`#svc-preview-${c}`}
              data-svc={c}
              key={SERVICES[c].title}
              aria-label={`${SERVICES[c].title} ${SERVICES[c].text}: open details`}
            >
              {renderBox(SERVICES[c], false)}
            </a>
          )
        )}
      </div>

      {createPortal(
        <div className="svc-ov" ref={overlayRef} role="dialog" aria-modal="true" aria-label="Service details" aria-hidden="true" data-lenis-prevent>
          <div className="svc-ov__reveal" />
          {SERVICES.map((s, i) => (
            <div className="svc-ov__item" id={`svc-preview-${i}`} key={s.title}>
              {renderBox(s, true)}
              <div className="svc-ov__content">
                <span className="svc-ov__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="svc-ov__lead">{s.detail}</span>
                {s.provides && (
                  <>
                    <span className="svc-ov__label">What you get</span>
                    <ul className="svc-ov__list">
                      {s.provides.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          ))}
          <button className="svc-ov__close" type="button" aria-label="Close">
            <svg className="svc-icon" viewBox="0 0 24 23" aria-hidden="true">
              <path d="M23.865 3.677c.197-.383.164-.818-.008-1.18.048-.41-.06-.827-.448-1.147L22.323.457c-.636-.524-1.632-.689-2.25 0a155.348 155.348 0 0 1-8.797 9.001C9.011 7.342 6.72 5.255 4.443 3.165c-.8-.734-1.956-.503-2.458.37C1.253 3.9.659 4.374.168 5.182c-.233.386-.215.872 0 1.258 1.47 2.635 4.31 4.951 6.646 7.083-.313.28-.623.562-.942.836-3.146 2.702-5.268 4.416-1.331 7.187.053.037.107.029.161.05.076.036.148.06.232.074.026 0 .05.005.075.003.082.007.16.027.243.011 2.117-.415 4.085-2.074 5.872-3.9 1.74 1.715 3.592 3.353 5.63 4.325.485.232 1.063.097 1.436-.227.626.047 1.197-.342 1.484-.901.042-.026.07-.041.116-.07.91-.569.993-1.701.32-2.482-1.522-1.762-3.138-3.438-4.787-5.084 2.968-2.9 6.674-6.027 8.542-9.667z" />
            </svg>
          </button>
        </div>,
        document.body
      )}
    </section>
  );
}