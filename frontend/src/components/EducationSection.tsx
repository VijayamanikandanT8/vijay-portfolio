import { useEffect, useRef } from "react";
import gsap from "gsap";
import SplitType from "split-type";
import "./EducationSection.css";

interface EducationItem {
  year: string;
  degree: string;
  short: string;
  desc: string;
  image: string;
  imageBig: string;
  institution: string;
  coursework: string;
}

// ---------------------------------------------------------------------------
// EDIT THIS LIST to change the education entries.
// Images live in public/images/education (1.jpg, 1_big.jpg, 2.jpg, ...)
// "short" is the big word shown when an entry is opened (keep it short).
// ---------------------------------------------------------------------------
const EDUCATION: EducationItem[] = [
  {
    year: "2016 - 2017",
    degree: "Secondary School (SSLC)",
    short: "SSLC",
    desc: "Completed secondary school education (SSLC) with 77%.",
    image: "/images/education/1.jpg",
    imageBig: "/images/education/1_big.jpg",
    institution: "Nadar Saraswathi Boys Higher Secondary School",
    coursework: "77%",
  },
  {
    year: "2017 - 2019",
    degree: "Higher Secondary (HSC)",
    short: "HSC",
    desc: "Completed higher secondary education (HSC) with 54.83%.",
    image: "/images/education/2.jpg",
    imageBig: "/images/education/2_big.jpg",
    institution: "Nadar Saraswathi Boys Higher Secondary School, Theni",
    coursework: "54.83%",
  },
  {
    year: "2019 - 2023",
    degree: "B.E. Computer Science (CSE)",
    short: "B.E.",
    desc: "Bachelor of Engineering in Computer Science with a CGPA of 8.35.",
    image: "/images/education/3.jpg",
    imageBig: "/images/education/3_big.jpg",
    institution: "Nadar Saraswathi College of Engineering and Technology, Theni",
    coursework: "CGPA 8.35",
  },
];

// ---------------------------------------------------------------------------
// Text line reveal (SplitType lines, each wrapped in an overflow-hidden div)
// ---------------------------------------------------------------------------
function wrapLines(lines: HTMLElement[], wrapType: string, wrapClass: string) {
  lines.forEach((el) => {
    const wrapEl = document.createElement(wrapType);
    wrapEl.className = wrapClass;
    el.parentNode?.appendChild(wrapEl);
    wrapEl.appendChild(el);
  });
}

function createLinesReveal(el: HTMLElement) {
  const split = new SplitType(el, { types: "lines", lineClass: "edu-line" });
  wrapLines(split.lines ?? [], "div", "edu-oh");
  let isVisible = false;

  const lines = () => split.lines ?? [];

  const lineIn = () => {
    isVisible = true;
    gsap.killTweensOf(lines());
    return gsap
      .timeline({ defaults: { duration: 1.1, ease: "power4.inOut" } })
      .addLabel("start", 0)
      .set(lines(), { yPercent: 105 }, "start")
      .to(lines(), { yPercent: 0, stagger: 0.05 }, "start");
  };

  const lineOut = () => {
    isVisible = false;
    gsap.killTweensOf(lines());
    return gsap
      .timeline({ defaults: { duration: 1.1, ease: "power4.inOut" } })
      .addLabel("start", 0)
      .to(lines(), { yPercent: -105, stagger: 0.05 }, "start");
  };

  // Re-split the text on resize
  const onResize = () => {
    split.split({});
    wrapLines(lines(), "div", "edu-oh");
    if (!isVisible) gsap.set(lines(), { yPercent: 105 });
  };
  window.addEventListener("resize", onResize);

  const destroy = () => {
    window.removeEventListener("resize", onResize);
    gsap.killTweensOf(lines());
    split.revert();
  };

  return { in: lineIn, out: lineOut, destroy };
}

export default function EducationSection() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const contentEl = root.querySelector<HTMLElement>(".edu-content")!;
    const frameEl = root.querySelector<HTMLElement>(".edu-frame")!;
    const overlayRows = Array.from(
      root.querySelectorAll<HTMLElement>(".edu-overlay__row"),
    );

    // Preview instances
    const previews = Array.from(
      root.querySelectorAll<HTMLElement>(".edu-preview"),
    ).map((el) => ({
      el,
      image: el.querySelector<HTMLElement>(".edu-preview__img")!,
      imageInner: el.querySelector<HTMLElement>(".edu-preview__img-inner")!,
      backCtrl: el.querySelector<HTMLElement>(".edu-preview__back")!,
      innerElements: Array.from(el.querySelectorAll<HTMLElement>(".edu-oh__inner")),
      multiLineWrap: Array.from(
        el.querySelectorAll<HTMLElement>(".edu-preview__column > p"),
      ),
      multiLines: [] as ReturnType<typeof createLinesReveal>[],
    }));
    previews.forEach((p) => {
      p.multiLines = p.multiLineWrap.map((line) => createLinesReveal(line));
    });

    type Preview = (typeof previews)[number];

    let busy = false;

    const openItem = (preview: Preview) => {
      if (busy) return;
      busy = true;

      // Bring the section exactly into view so the full-screen overlay and
      // the preview line up, and lock page scrolling while it is open.
      const top = root.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "instant" });
      document.body.classList.add("edu-lock");
      root.classList.add("edu--open");

      gsap
        .timeline({
          defaults: { duration: 1, ease: "power3.inOut" },
          onComplete: () => {
            busy = false;
          },
        })
        .addLabel("start", 0)
        .add(() => {
          contentEl.classList.add("edu-content--hidden");
        }, "start")
        .set([preview.innerElements, preview.backCtrl], { opacity: 0 }, "start")
        .to(overlayRows, { scaleY: 1 }, "start")
        .addLabel("content", "start+=0.6")
        .add(() => {
          root.classList.add("edu--preview-visible");
          gsap.set(frameEl, { opacity: 0 });
          preview.el.classList.add("edu-preview--current");
        }, "content")
        // Image animation (reveal animation)
        .to(
          [preview.image, preview.imageInner],
          {
            startAt: { y: (pos: number) => (pos ? "101%" : "-101%") },
            y: "0%",
          },
          "content",
        )
        .add(() => {
          for (const line of preview.multiLines) line.in();
          gsap.set(preview.multiLineWrap, { opacity: 1, delay: 0.1 });
        }, "content")
        // Animate frame element
        .to(
          frameEl,
          {
            ease: "expo",
            startAt: { y: "-100%", opacity: 0 },
            opacity: 1,
            y: "0%",
          },
          "content+=0.3",
        )
        .to(
          preview.innerElements,
          {
            ease: "expo",
            startAt: { yPercent: 101 },
            yPercent: 0,
            opacity: 1,
          },
          "content+=0.3",
        )
        .to(preview.backCtrl, { opacity: 1 }, "content");
    };

    const closeItem = (preview: Preview) => {
      if (busy) return;
      busy = true;

      gsap
        .timeline({
          defaults: { duration: 1, ease: "power3.inOut" },
          onComplete: () => {
            busy = false;
          },
        })
        .addLabel("start", 0)
        .to(preview.innerElements, { yPercent: -101, opacity: 0 }, "start")
        .add(() => {
          for (const line of preview.multiLines) line.out();
        }, "start")
        .to(preview.backCtrl, { opacity: 0 }, "start")
        .to(preview.image, { y: "101%" }, "start")
        .to(preview.imageInner, { y: "-101%" }, "start")
        // Animate frame element
        .to(
          frameEl,
          {
            opacity: 0,
            y: "-100%",
            onComplete: () => {
              root.classList.remove("edu--preview-visible");
              gsap.set(frameEl, { opacity: 1, y: "0%" });
            },
          },
          "start",
        )
        .addLabel("grid", "start+=0.6")
        .to(
          overlayRows,
          {
            scaleY: 0,
            onComplete: () => {
              preview.el.classList.remove("edu-preview--current");
              contentEl.classList.remove("edu-content--hidden");
              root.classList.remove("edu--open");
              document.body.classList.remove("edu-lock");
            },
          },
          "grid",
        );
    };

    // Wire up items
    const cleanups: Array<() => void> = [];
    root.querySelectorAll<HTMLElement>(".edu-item").forEach((itemEl, pos) => {
      const preview = previews[pos];
      if (!preview) return;
      const link = itemEl.querySelector<HTMLElement>(".edu-item__link")!;
      const imageInner = itemEl.querySelector<HTMLElement>(".edu-item__img-inner")!;

      const onEnter = () => {
        gsap.killTweensOf(imageInner);
        gsap.to(imageInner, { duration: 2, ease: "power4", scale: 1.2 });
      };
      const onLeave = () => {
        gsap.killTweensOf(imageInner);
        gsap.to(imageInner, { duration: 0.7, ease: "expo", scale: 1 });
      };
      const onOpen = () => openItem(preview);
      const onClose = () => closeItem(preview);

      link.addEventListener("mouseenter", onEnter);
      link.addEventListener("mouseleave", onLeave);
      link.addEventListener("click", onOpen);
      preview.backCtrl.addEventListener("click", onClose);

      cleanups.push(() => {
        link.removeEventListener("mouseenter", onEnter);
        link.removeEventListener("mouseleave", onLeave);
        link.removeEventListener("click", onOpen);
        preview.backCtrl.removeEventListener("click", onClose);
        gsap.killTweensOf(imageInner);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
      gsap.killTweensOf([frameEl, overlayRows]);
      previews.forEach((p) => {
        gsap.killTweensOf([p.image, p.imageInner, p.innerElements, p.backCtrl, p.multiLineWrap]);
        p.multiLines.forEach((l) => l.destroy());
      });
      document.body.classList.remove("edu-lock");
    };
  }, []);

  return (
    <section className="education" id="education" ref={rootRef}>
      <div className="edu-main">
        <div className="edu-frame">
          <div className="edu-frame__title">
            <h1 className="edu-frame__title-main">Education</h1>
          </div>
          <div className="edu-frame__credits">Schools &amp; qualifications</div>
        </div>

        <div className="edu-content">
          {EDUCATION.map((item) => (
            <div className="edu-item" key={item.degree}>
              <span className="edu-item__meta">{item.year}</span>
              <h2 className="edu-item__title">{item.degree}</h2>
              <div className="edu-item__img">
                <div
                  className="edu-item__img-inner"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
              </div>
              <p className="edu-item__desc">{item.desc}</p>
              <button type="button" className="edu-item__link">
                view
              </button>
            </div>
          ))}
        </div>

        <div className="edu-overlay">
          <div className="edu-overlay__row" />
          <div className="edu-overlay__row" />
        </div>

        <section className="edu-previews">
          {EDUCATION.map((item) => (
            <div className="edu-preview" key={item.degree}>
              <div className="edu-preview__img">
                <div
                  className="edu-preview__img-inner"
                  style={{ backgroundImage: `url(${item.imageBig})` }}
                />
              </div>
              <h2 className="edu-preview__title edu-oh">
                <span className="edu-oh__inner">{item.short}</span>
              </h2>
              <div className="edu-preview__column edu-preview__column--start">
                <span className="edu-preview__column-title edu-preview__column-title--main edu-oh">
                  <span className="edu-oh__inner">{item.degree}</span>
                </span>
                <span className="edu-oh">
                  <span className="edu-oh__inner">{item.year}</span>
                </span>
              </div>
              <div className="edu-preview__column">
                <h3 className="edu-preview__column-title edu-oh">
                  <span className="edu-oh__inner">Institution</span>
                </h3>
                <p>{item.institution}</p>
              </div>
              <div className="edu-preview__column">
                <h3 className="edu-preview__column-title edu-oh">
                  <span className="edu-oh__inner">Score</span>
                </h3>
                <p>{item.coursework}</p>
              </div>
              <button type="button" className="edu-unbutton edu-preview__back" aria-label="Back">
                <svg width="100px" height="18px" viewBox="0 0 50 9">
                  <path
                    vectorEffect="non-scaling-stroke"
                    d="m0 4.5 5-3m-5 3 5 3m45-3h-77"
                  />
                </svg>
              </button>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}