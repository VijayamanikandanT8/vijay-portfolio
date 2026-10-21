import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "./CertificationsSection.css";

gsap.registerPlugin(ScrollTrigger);

interface CertItem {
  image: string;
  name: string;
  short: string;
  caption: string;
  issuer: string;
  year: string;
  credential: string;
  skills: string;
}

// ---------------------------------------------------------------------------
// EDIT THIS LIST to change your certifications.
// Images live in public/images/certifications (1.jpg, 2.jpg, 3.jpg, 4.jpg)
// "short" is the big word shown when a certificate is opened (keep it short).
// ---------------------------------------------------------------------------
const CERTIFICATIONS: CertItem[] = [
  {
    image: "/images/certifications/1.jpg",
    name: "Python Full Stack",
    short: "Python",
    caption: "Python Full Stack Development, PySpiders.",
    issuer: "PySpiders",
    year: "Granted 14.10.2025",
    credential: "Python Full Stack Development certification, granted on 14 October 2025.",
    skills: "HTML, CSS, JavaScript, Python, Django, Oracle SQL.",
  },
  {
    image: "/images/certifications/2.jpg",
    name: "Data Analytics",
    short: "Data",
    caption: "Data Analytics certification, PySpiders.",
    issuer: "PySpiders",
    year: "Granted 14.10.2025",
    credential: "Data Analytics certification, granted on 14 October 2025.",
    skills: "Python, Power BI, SQL.",
  },
  {
    image: "/images/certifications/3.jpg",
    name: "Skill & Job Recommender",
    short: "IBM",
    caption: "IBM certificate for the Skill and Job Recommender project.",
    issuer: "IBM · ICT Academy",
    year: "23 March 2023",
    credential: "IBM certificate for successfully completing the project on Skill and Job Recommender, issued by ICT Academy.",
    skills: "Project work, Recommendation systems, Python.",
  },
  {
    image: "/images/certifications/4.jpg",
    name: "C Programming",
    short: "C Lang",
    caption: "Problem Solving Through Programming in C.",
    issuer: "IIT Kharagpur · NPTEL",
    year: "Jan – Apr 2020",
    credential: "Problem Solving Through Programming in C, provided by the Indian Institute of Technology Kharagpur through SWAYAM, NPTEL.",
    skills: "C programming, Problem solving, Logic building.",
  },
  {
    image: "/images/certifications/5.jpg",
    name: "Typewriting (Senior)",
    short: "Typing",
    caption: "Senior Grade Typewriting (English), First Class.",
    issuer: "Govt. of Tamil Nadu",
    year: "Aug 2022",
    credential: "Senior Grade Typewriting in English, Department of Technical Education, Government of Tamil Nadu. Passed in First Class.",
    skills: "English typewriting, 45 words per minute.",
  },
  {
    image: "/images/certifications/6.jpg",
    name: "AI Tools & Claude",
    short: "AI",
    caption: "AI Tools and Claude Workshop, be10x.",
    issuer: "be10x",
    year: "13 Sep 2026",
    credential: "Certificate for completing the AI Tools and Claude workshop, issued by be10x.",
    skills: "AI tools, Claude, Prompting, AI workflows.",
  },
];

export default function CertificationsSection() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const overlayInner = root.querySelector<HTMLElement>(".cert-overlay__inner")!;
    const backCtrl = root.querySelector<HTMLElement>(".cert-preview__back")!;

    gsap.set(overlayInner, { xPercent: -100 });
    gsap.set(backCtrl, { xPercent: -50 });

    const previews = Array.from(
      root.querySelectorAll<HTMLElement>(".cert-preview__item"),
    ).map((el) => ({
      el,
      img: el.querySelector<HTMLElement>(".cert-preview__item-img")!,
      imgWrap: el.querySelector<HTMLElement>(".cert-preview__item-img-wrap")!,
      slideTexts: Array.from(el.querySelectorAll<HTMLElement>(".cert-oh__inner")),
      descriptions: Array.from(
        el.querySelectorAll<HTMLElement>(".cert-preview__item-box-desc"),
      ),
    }));

    const items = Array.from(root.querySelectorAll<HTMLElement>(".cert-item")).map(
      (el) => ({
        el,
        imgWrap: el.querySelector<HTMLElement>(".cert-item__img-wrap")!,
        img: el.querySelector<HTMLElement>(".cert-item__img")!,
        titleInner: el.querySelector<HTMLElement>(".cert-item__title .cert-oh__inner")!,
      }),
    );

    let current = -1;
    let scrollST: ScrollTrigger | undefined;
    let isAnimating = false;
    const cleanups: Array<() => void> = [];

    items.forEach((item, pos) => {
      const preview = previews[pos];
      if (!preview) return;

      const onClick = () => {
        if (isAnimating) return;
        isAnimating = true;
        current = pos;

        // bring the section exactly into view and lock page scrolling
        const top = root.getBoundingClientRect().top + window.scrollY;
        if (scrollST) {
          if (!scrollST.isActive) {
            const y = scrollST.progress >= 1 ? scrollST.end : scrollST.start;
            if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
            else window.scrollTo({ top: y, behavior: "instant" });
          }
        } else {
          window.scrollTo({ top, behavior: "instant" });
        }
        document.body.classList.add("cert-lock");

        gsap
          .timeline({
            defaults: { duration: 1.1, ease: "expo" },
            onStart: () => {
              root.classList.add("cert--open");
              gsap.set(preview.img, { xPercent: 100 });
              gsap.set(preview.imgWrap, { xPercent: -102, opacity: 0 });
              gsap.set(preview.slideTexts, { yPercent: 100 });
              gsap.set(preview.descriptions, { yPercent: 15, opacity: 0 });
              gsap.set(backCtrl, { x: 30, opacity: 0 });
              preview.el.classList.add("cert-preview__item--current");
            },
            onComplete: () => {
              isAnimating = false;
            },
          })
          .addLabel("start", 0)
          .addLabel("preview", "start+=0.3")
          .to(overlayInner, { ease: "power2", startAt: { xPercent: -100 }, xPercent: 0 }, "start")
          .to([preview.img, preview.imgWrap], { xPercent: 0 }, "preview")
          .to(preview.imgWrap, { opacity: 1 }, "preview")
          .to(preview.slideTexts, { yPercent: 0, stagger: 0.05 }, "preview")
          .to(preview.descriptions, { ease: "power2", opacity: 1, stagger: 0.05 }, "preview")
          .to(preview.descriptions, { yPercent: 0, stagger: 0.05 }, "preview")
          .to(backCtrl, { ease: "power2", opacity: 1, x: 0 }, "preview");
      };

      const onEnter = () => {
        gsap
          .timeline({ defaults: { duration: 0.6, ease: "expo" } })
          .addLabel("start", 0)
          .set(item.titleInner, { transformOrigin: "0% 50%" }, "start")
          .to(
            item.titleInner,
            {
              startAt: { filter: "blur(0px)" },
              duration: 0.2,
              ease: "power1.in",
              yPercent: -100,
              rotation: -4,
              filter: "blur(6px)",
            },
            "start",
          )
          .to(
            item.titleInner,
            {
              startAt: { yPercent: 100, rotation: 4, filter: "blur(6px)" },
              yPercent: 0,
              rotation: 0,
              filter: "blur(0px)",
            },
            "start+=0.2",
          )
          .to(item.imgWrap, { scale: 0.95 }, "start")
          .to(item.img, { scale: 1.2 }, "start");
      };

      const onLeave = () => {
        gsap
          .timeline({ defaults: { duration: 0.8, ease: "power4" } })
          .to([item.imgWrap, item.img], { scale: 1 }, 0);
      };

      item.imgWrap.addEventListener("click", onClick);
      item.imgWrap.addEventListener("mouseenter", onEnter);
      item.imgWrap.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        item.imgWrap.removeEventListener("click", onClick);
        item.imgWrap.removeEventListener("mouseenter", onEnter);
        item.imgWrap.removeEventListener("mouseleave", onLeave);
        gsap.killTweensOf([item.imgWrap, item.img, item.titleInner]);
      });
    });

    const onBack = () => {
      if (isAnimating || current < 0) return;
      isAnimating = true;
      const preview = previews[current];

      gsap
        .timeline({
          defaults: { duration: 1, ease: "power4" },
          onComplete: () => {
            preview.el.classList.remove("cert-preview__item--current");
            root.classList.remove("cert--open");
            document.body.classList.remove("cert-lock");
            isAnimating = false;
          },
        })
        .addLabel("start", 0)
        .to(backCtrl, { ease: "power2", opacity: 0 }, "start")
        .to(preview.descriptions, { ease: "power2", opacity: 0 }, "start")
        .to(preview.descriptions, { yPercent: 15 }, "start")
        .to(preview.slideTexts, { yPercent: 100 }, "start")
        .to(preview.img, { xPercent: -100 }, "start")
        .to(preview.imgWrap, { xPercent: 100, opacity: 1 }, "start")
        .to(overlayInner, { ease: "power2", xPercent: 100 }, "start+=0.4");
    };
    backCtrl.addEventListener("click", onBack);

    // ---- Wheel-driven horizontal scroll (desktop) -------------------------
    // The section pins to the screen; vertical scrolling slides the cards
    // sideways, then the pin releases and the page continues to the next section.
    const content = root.querySelector<HTMLElement>(".cert-content")!;
    const bar = root.querySelector<HTMLElement>(".cert-progress__bar")!;
    const counter = root.querySelector<HTMLElement>(".cert-counter b")!;
    const total = items.length;
    const getDistance = () => Math.max(0, content.offsetWidth - root.clientWidth);

    const mm = gsap.matchMedia();
    mm.add("(min-width: 53em)", () => {
      const skewTo = gsap.quickTo(content, "skewX", { duration: 0.6, ease: "power3" });
      const slide = gsap.to(content, { x: () => -getDistance(), ease: "none" });

      scrollST = ScrollTrigger.create({
        id: "certifications-scroll",
        refreshPriority: -1,
        trigger: root,
        start: "top top",
        end: () => "+=" + getDistance() * 1.25,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: slide,
        onUpdate: (self) => {
          bar.style.transform = `scaleX(${self.progress})`;
          counter.textContent = String(
            Math.round(self.progress * (total - 1)) + 1,
          ).padStart(2, "0");
          skewTo(gsap.utils.clamp(-4, 4, self.getVelocity() / -300));
        },
        onScrubComplete: () => skewTo(0),
      });

      return () => {
        scrollST = undefined;
      };
    });

    // fonts can change text height after first paint, so re-measure once ready
    let alive = true;
    const refreshAll = () => {
      if (alive) ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(refreshAll);
    window.addEventListener("load", refreshAll);
    const settleTimer = window.setTimeout(refreshAll, 1500);

    return () => {
      cleanups.forEach((fn) => fn());
      alive = false;
      window.removeEventListener("load", refreshAll);
      window.clearTimeout(settleTimer);
      mm.revert();
      backCtrl.removeEventListener("click", onBack);
      gsap.killTweensOf(overlayInner);
      gsap.killTweensOf(backCtrl);
      previews.forEach((p) =>
        gsap.killTweensOf([p.img, p.imgWrap, p.slideTexts, p.descriptions]),
      );
      document.body.classList.remove("cert-lock");
    };
  }, []);

  return (
    <section className="certifications" id="certifications" ref={rootRef}>
      <div className="cert-main">
        <div className="cert-frame">
          <h1 className="cert-frame__title">Certifications</h1>
          <span className="cert-frame__sub">Courses &amp; credentials</span>
        </div>

        <div className="cert-progress">
          <span className="cert-progress__bar" />
        </div>
        <div className="cert-counter">
          <b>01</b> / {String(CERTIFICATIONS.length).padStart(2, "0")}
        </div>

        <div className="cert-content">
          {CERTIFICATIONS.map((c) => (
            <figure className="cert-item" key={c.name}>
              <h2 className="cert-item__title cert-oh">
                <span className="cert-oh__inner">{c.name}</span>
              </h2>
              <div className="cert-item__img-wrap">
                <div
                  className="cert-item__img"
                  style={{ backgroundImage: `url(${c.image})` }}
                />
              </div>
              <figcaption className="cert-item__caption">{c.caption}</figcaption>
            </figure>
          ))}
        </div>

        <div className="cert-overlay">
          <div className="cert-overlay__inner" />
        </div>

        <div className="cert-preview">
          {CERTIFICATIONS.map((c) => (
            <div className="cert-preview__item" key={c.name}>
              <div className="cert-preview__item-img-outer">
                <div className="cert-preview__item-img-wrap">
                  <div
                    className="cert-preview__item-img"
                    style={{ backgroundImage: `url(${c.image})` }}
                  />
                </div>
              </div>
              <h2 className="cert-preview__item-title cert-oh">
                <span className="cert-oh__inner">{c.short}</span>
              </h2>
              <h3 className="cert-preview__item-subtitle cert-oh">
                <span className="cert-oh__inner">{c.issuer}</span>
              </h3>
              <span className="cert-preview__item-meta cert-oh">
                <span className="cert-oh__inner">{c.year}</span>
              </span>
              <div className="cert-preview__item-box cert-preview__item-box--left">
                <h3 className="cert-preview__item-box-title cert-oh">
                  <span className="cert-oh__inner">Details</span>
                </h3>
                <p className="cert-preview__item-box-desc">{c.credential}</p>
              </div>
              <div className="cert-preview__item-box cert-preview__item-box--right">
                <h3 className="cert-preview__item-box-title cert-oh">
                  <span className="cert-oh__inner">Skills</span>
                </h3>
                <p className="cert-preview__item-box-desc">{c.skills}</p>
              </div>
            </div>
          ))}
          <button type="button" className="cert-unbutton cert-preview__back" aria-label="Back to certifications">
            <svg width="200px" height="36px" viewBox="0 0 50 9">
              <path vectorEffect="non-scaling-stroke" d="m0 4.5 5-3m-5 3 5 3m45-3h-77" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}